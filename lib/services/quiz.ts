import "server-only";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit";
import { notify, notifyMany } from "@/lib/services/notification";
import { getCourseQuizGate, recalculateCourseProgress } from "@/lib/services/progress";
import type { QuizQuestionType } from "@prisma/client";
import type {
  QuizSettingsInput,
  QuizQuestionInput,
  QuizOptionInput,
  SubmitAttemptInput,
  ReviewAttemptInput,
} from "@/lib/validations/quiz";

// ---------------------------------------------------------------------------
// Montagem da prova (admin)
// ---------------------------------------------------------------------------

export async function getQuizForEditing(courseId: string) {
  return prisma.quiz.findUnique({
    where: { courseId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      _count: { select: { attempts: true } },
    },
  });
}

/** Cria a prova vazia do curso (idempotente) — chamado quando o admin habilita a prova. */
export async function ensureQuiz(courseId: string, actorId: string) {
  const existing = await prisma.quiz.findUnique({ where: { courseId } });
  if (existing) {
    if (!existing.isActive) {
      await prisma.quiz.update({ where: { courseId }, data: { isActive: true } });
    }
    return existing;
  }
  const quiz = await prisma.quiz.create({ data: { courseId } });
  await logAction({ actorId, action: "QUIZ_CREATED", entityType: "Quiz", entityId: quiz.id });
  return quiz;
}

export async function updateQuizSettings(input: QuizSettingsInput, actorId: string) {
  const quiz = await prisma.quiz.update({
    where: { courseId: input.courseId },
    data: {
      title: input.title,
      description: input.description || null,
      passingScore: input.passingScore,
      maxAttempts: input.maxAttempts,
      isActive: input.isActive,
    },
  });
  await logAction({ actorId, action: "QUIZ_UPDATED", entityType: "Quiz", entityId: quiz.id });
  return quiz;
}

export async function setQuizActive(courseId: string, isActive: boolean, actorId: string) {
  const quiz = await prisma.quiz.update({ where: { courseId }, data: { isActive } });
  await logAction({
    actorId,
    action: isActive ? "QUIZ_ENABLED" : "QUIZ_DISABLED",
    entityType: "Quiz",
    entityId: quiz.id,
  });
  return quiz;
}

export async function createQuestion(quizId: string, type: QuizQuestionType) {
  const last = await prisma.quizQuestion.findFirst({ where: { quizId }, orderBy: { order: "desc" } });
  return prisma.quizQuestion.create({
    data: {
      quizId,
      type,
      prompt: "",
      order: (last?.order ?? -1) + 1,
      // Objetiva já nasce com duas alternativas em branco para agilizar.
      options:
        type === "OBJECTIVE"
          ? { create: [{ text: "", order: 0 }, { text: "", order: 1 }] }
          : undefined,
    },
  });
}

export async function updateQuestion(questionId: string, data: QuizQuestionInput) {
  return prisma.quizQuestion.update({
    where: { id: questionId },
    data: { prompt: data.prompt, points: data.points },
  });
}

export async function deleteQuestion(questionId: string) {
  return prisma.quizQuestion.delete({ where: { id: questionId } });
}

export async function reorderQuestions(items: { id: string; order: number }[]) {
  await prisma.$transaction(
    items.map((item) => prisma.quizQuestion.update({ where: { id: item.id }, data: { order: item.order } }))
  );
}

export async function createOption(questionId: string) {
  const last = await prisma.quizOption.findFirst({ where: { questionId }, orderBy: { order: "desc" } });
  return prisma.quizOption.create({
    data: { questionId, text: "", order: (last?.order ?? -1) + 1 },
  });
}

export async function updateOption(optionId: string, data: QuizOptionInput) {
  return prisma.quizOption.update({
    where: { id: optionId },
    data: { text: data.text, isCorrect: data.isCorrect },
  });
}

/** Marca uma alternativa como a correta e zera as demais da mesma questão. */
export async function setCorrectOption(questionId: string, optionId: string) {
  await prisma.$transaction([
    prisma.quizOption.updateMany({ where: { questionId }, data: { isCorrect: false } }),
    prisma.quizOption.update({ where: { id: optionId }, data: { isCorrect: true } }),
  ]);
}

export async function deleteOption(optionId: string) {
  return prisma.quizOption.delete({ where: { id: optionId } });
}

// ---------------------------------------------------------------------------
// Prova do colaborador
// ---------------------------------------------------------------------------

export type LearnerBlockingReason = "lessons" | "pending" | "approved" | "no_attempts" | null;

/**
 * Prova preparada para o colaborador — as alternativas nunca carregam qual é a
 * correta. Junto vem o estado das tentativas, para a UI decidir o que mostrar.
 */
export async function getQuizForLearner(courseId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } } },
      },
    },
  });

  if (!quiz || !quiz.isActive || quiz.questions.length === 0) return null;

  const [totalLessons, completedLessons, attempts] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { userId, status: "COMPLETED", lesson: { module: { courseId } } },
    }),
    prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, userId },
      orderBy: { attemptNo: "desc" },
      select: { id: true, attemptNo: true, status: true, finalScorePct: true, reviewNote: true, submittedAt: true },
    }),
  ]);

  const lessonsDone = totalLessons > 0 && completedLessons === totalLessons;
  const attemptsUsed = attempts.length;
  const attemptsLeft = Math.max(0, quiz.maxAttempts - attemptsUsed);
  const latestAttempt = attempts[0] ?? null;
  const isApproved = attempts.some((a) => a.status === "APPROVED");
  const hasPending = latestAttempt?.status === "PENDING_REVIEW";

  let blockingReason: LearnerBlockingReason = null;
  if (isApproved) blockingReason = "approved";
  else if (hasPending) blockingReason = "pending";
  else if (!lessonsDone) blockingReason = "lessons";
  else if (attemptsLeft === 0) blockingReason = "no_attempts";

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      maxAttempts: quiz.maxAttempts,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
      })),
    },
    lessonsDone,
    attemptsUsed,
    attemptsLeft,
    latestAttempt,
    isApproved,
    canAttempt: blockingReason === null,
    blockingReason,
  };
}

export async function submitAttempt(userId: string, input: SubmitAttemptInput) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: input.quizId },
    include: {
      course: { select: { id: true, title: true } },
      questions: { include: { options: true } },
    },
  });
  if (!quiz || !quiz.isActive || quiz.questions.length === 0) {
    throw new Error("Prova indisponível.");
  }
  const courseId = quiz.course.id;

  const [totalLessons, completedLessons, attempts] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { userId, status: "COMPLETED", lesson: { module: { courseId } } },
    }),
    prisma.quizAttempt.findMany({ where: { quizId: quiz.id, userId }, orderBy: { attemptNo: "desc" } }),
  ]);

  if (!(totalLessons > 0 && completedLessons === totalLessons)) {
    throw new Error("Conclua todas as aulas antes de fazer a prova.");
  }
  if (attempts.some((a) => a.status === "APPROVED")) {
    throw new Error("Você já foi aprovado nesta prova.");
  }
  if (attempts[0]?.status === "PENDING_REVIEW") {
    throw new Error("Você já tem uma prova aguardando correção.");
  }
  if (attempts.length >= quiz.maxAttempts) {
    throw new Error("Você atingiu o limite de tentativas. Procure o administrador.");
  }

  const answersByQuestion = new Map(input.answers.map((a) => [a.questionId, a]));

  let objectivePointsPossible = 0;
  let objectivePointsEarned = 0;

  const answerData = quiz.questions.map((question) => {
    const submitted = answersByQuestion.get(question.id);

    if (question.type === "OBJECTIVE") {
      objectivePointsPossible += question.points;
      const chosen =
        submitted?.selectedOptionId &&
        question.options.find((o) => o.id === submitted.selectedOptionId);
      const isCorrect = !!chosen && chosen.isCorrect;
      if (isCorrect) objectivePointsEarned += question.points;
      return {
        questionId: question.id,
        selectedOptionId: chosen ? chosen.id : null,
        textResponse: null,
        isCorrect,
      };
    }

    return {
      questionId: question.id,
      selectedOptionId: null,
      textResponse: submitted?.textResponse?.trim() || null,
      isCorrect: null,
    };
  });

  const autoScorePct =
    objectivePointsPossible > 0
      ? Math.round((objectivePointsEarned / objectivePointsPossible) * 100)
      : null;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      attemptNo: (attempts[0]?.attemptNo ?? 0) + 1,
      status: "PENDING_REVIEW",
      autoScorePct,
      answers: { create: answerData },
    },
  });

  const [learner, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.user.findMany({ where: { role: { code: "ADMIN" }, status: "ACTIVE" }, select: { id: true } }),
  ]);
  await notifyMany(
    admins.map((a) => a.id),
    "QUIZ_SUBMITTED",
    `${learner?.name ?? "Um colaborador"} enviou a prova do curso "${quiz.course.title}" para correção.`
  );

  return attempt;
}

// ---------------------------------------------------------------------------
// Correção (admin)
// ---------------------------------------------------------------------------

interface ListPendingParams {
  courseId?: string;
  page?: number;
  pageSize?: number;
}

export async function listPendingAttempts(params: ListPendingParams) {
  const { courseId, page = 1, pageSize = 20 } = params;
  const where = {
    status: "PENDING_REVIEW" as const,
    ...(courseId ? { quiz: { courseId } } : {}),
  };

  const [attempts, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where,
      include: {
        user: { include: { department: true } },
        quiz: { include: { course: { select: { id: true, title: true } } } },
        _count: { select: { answers: true } },
      },
      orderBy: { submittedAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quizAttempt.count({ where }),
  ]);

  return { attempts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function countPendingAttempts(courseId: string) {
  return prisma.quizAttempt.count({ where: { status: "PENDING_REVIEW", quiz: { courseId } } });
}

export async function getAttemptForReview(attemptId: string) {
  return prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { include: { department: true } },
      quiz: { include: { course: { select: { id: true, title: true } } } },
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
          selectedOption: true,
        },
      },
    },
  });
}

export async function reviewAttempt(attemptId: string, input: ReviewAttemptInput, actorId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { course: { select: { id: true, title: true } }, questions: { select: { id: true, points: true, type: true } } } },
      answers: { include: { question: { select: { id: true, points: true, type: true } } } },
    },
  });
  if (!attempt) throw new Error("Tentativa não encontrada.");
  if (attempt.status !== "PENDING_REVIEW") throw new Error("Esta tentativa já foi corrigida.");

  const courseId = attempt.quiz.course.id;
  const gradesByAnswer = new Map(input.grades.map((g) => [g.answerId, g]));

  // Aplica a correção das questões de texto.
  await prisma.$transaction(
    attempt.answers
      .filter((a) => a.question.type === "TEXT")
      .map((a) => {
        const grade = gradesByAnswer.get(a.id);
        const isCorrect = grade?.isCorrect ?? false;
        const awardedPoints =
          grade?.awardedPoints ?? (isCorrect ? a.question.points : 0);
        return prisma.quizAnswer.update({
          where: { id: a.id },
          data: { isCorrect, awardedPoints },
        });
      })
  );

  const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = attempt.answers.reduce((sum, a) => {
    if (a.question.type === "OBJECTIVE") return sum + (a.isCorrect ? a.question.points : 0);
    const grade = gradesByAnswer.get(a.id);
    const isCorrect = grade?.isCorrect ?? false;
    return sum + (grade?.awardedPoints ?? (isCorrect ? a.question.points : 0));
  }, 0);
  const finalScorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: input.decision,
      finalScorePct,
      reviewNote: input.reviewNote?.trim() || null,
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
  });

  if (input.decision === "APPROVED") {
    await recalculateCourseProgress(attempt.userId, courseId);
    await notify(
      attempt.userId,
      "QUIZ_APPROVED",
      `Sua prova do curso "${attempt.quiz.course.title}" foi aprovada (${finalScorePct}%). Curso concluído.`
    );
  } else {
    const attemptsUsed = await prisma.quizAttempt.count({ where: { quizId: attempt.quizId, userId: attempt.userId } });
    const attemptsLeft = Math.max(0, attempt.quiz.maxAttempts - attemptsUsed);
    await notify(
      attempt.userId,
      "QUIZ_REJECTED",
      attemptsLeft > 0
        ? `Sua prova do curso "${attempt.quiz.course.title}" não foi aprovada. Você ainda pode tentar ${attemptsLeft} vez(es).`
        : `Sua prova do curso "${attempt.quiz.course.title}" não foi aprovada e você não tem mais tentativas. Procure o administrador.`
    );
  }

  await logAction({
    actorId,
    action: input.decision === "APPROVED" ? "QUIZ_ATTEMPT_APPROVED" : "QUIZ_ATTEMPT_REJECTED",
    entityType: "QuizAttempt",
    entityId: attemptId,
    metadata: { finalScorePct },
  });

  return { finalScorePct, decision: input.decision };
}
