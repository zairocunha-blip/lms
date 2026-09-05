import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // --- Papéis -----------------------------------------------------------------
  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: { code: "ADMIN", name: "Administrador" },
  });
  const employeeRole = await prisma.role.upsert({
    where: { code: "EMPLOYEE" },
    update: {},
    create: { code: "EMPLOYEE", name: "Colaborador" },
  });

  // --- Departamentos ------------------------------------------------------------
  const departmentNames = ["Tecnologia", "Recursos Humanos", "Atendimento ao Cliente", "Financeiro"];
  const departments = await Promise.all(
    departmentNames.map((name) => prisma.department.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const [techDept, hrDept, supportDept] = departments;
  if (!techDept || !hrDept || !supportDept) throw new Error("Falha ao criar departamentos.");

  // --- Categorias -----------------------------------------------------------------
  const categoryNames = ["Integração", "Segurança", "Tecnologia", "Atendimento", "Processos", "Compliance"];
  const categories = await Promise.all(
    categoryNames.map((name) => prisma.category.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const [integrationCat, securityCat, , supportCat] = categories;
  if (!integrationCat || !securityCat || !supportCat) throw new Error("Falha ao criar categorias.");

  // --- Usuários -----------------------------------------------------------------
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@empresa.local",
      passwordHash: adminPassword,
      roleId: adminRole.id,
      status: "ACTIVE",
      // Contas de demonstração já entram com senha própria — não passam pela
      // troca obrigatória do primeiro acesso.
      mustChangePassword: false,
      jobTitle: "Administrador da plataforma",
    },
  });

  const employeeSeeds = [
    { name: "Ana Beatriz Souza", email: "ana.souza@empresa.local", jobTitle: "Analista de RH", departmentId: hrDept.id },
    { name: "Carlos Eduardo Lima", email: "carlos.lima@empresa.local", jobTitle: "Desenvolvedor Backend", departmentId: techDept.id },
    { name: "Fernanda Torres", email: "fernanda.torres@empresa.local", jobTitle: "Analista de Suporte", departmentId: supportDept.id },
    { name: "João Pedro Alves", email: "joao.alves@empresa.local", jobTitle: "Desenvolvedor Frontend", departmentId: techDept.id },
    { name: "Mariana Costa", email: "mariana.costa@empresa.local", jobTitle: "Coordenadora de Atendimento", departmentId: supportDept.id },
  ];

  const employeePassword = await bcrypt.hash("Colaborador@123", 12);
  const employees = await Promise.all(
    employeeSeeds.map((seed) =>
      prisma.user.upsert({
        where: { email: seed.email },
        update: {},
        create: {
          ...seed,
          passwordHash: employeePassword,
          roleId: employeeRole.id,
          status: "ACTIVE",
          mustChangePassword: false,
          hiredAt: new Date("2025-02-01"),
        },
      })
    )
  );

  // --- Curso 1: Integração de novos colaboradores --------------------------------
  const onboardingCourse = await prisma.course.upsert({
    where: { id: "seed-course-onboarding" },
    update: {},
    create: {
      id: "seed-course-onboarding",
      title: "Integração de novos colaboradores",
      description: "Tudo o que você precisa saber para começar bem na empresa: cultura, políticas e ferramentas do dia a dia.",
      status: "PUBLISHED",
      categoryId: integrationCat.id,
      createdById: admin.id,
      modules: {
        create: [
          {
            title: "Bem-vindo(a) à empresa",
            order: 0,
            lessons: {
              create: [
                {
                  title: "Nossa cultura e valores",
                  order: 0,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `# Nossa cultura e valores\n\nSeja bem-vindo(a)! Este curso foi criado para te ajudar a dar os primeiros passos com confiança.\n\n## Nossos valores\n\n- **Transparência**: compartilhamos informação de forma aberta.\n- **Colaboração**: trabalhamos em equipe, entre áreas.\n- **Melhoria contínua**: buscamos aprender e evoluir todos os dias.\n\n> "Cultura não é o que está escrito na parede — é o que fazemos quando ninguém está olhando."\n\n## Como usamos este espaço\n\nEsta plataforma reúne os treinamentos obrigatórios e recomendados para o seu cargo. Você pode acompanhar seu progresso a qualquer momento pelo menu **Meus cursos**.`,
                    },
                  },
                },
                {
                  title: "Estrutura organizacional",
                  order: 1,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `## Como estamos organizados\n\nA empresa é dividida nos seguintes departamentos:\n\n| Departamento | Responsabilidade |\n|---|---|\n| Tecnologia | Produtos e sistemas internos |\n| Recursos Humanos | Pessoas e cultura |\n| Atendimento ao Cliente | Suporte e relacionamento |\n| Financeiro | Contas e planejamento |\n\nEm caso de dúvida sobre quem procurar, fale com seu gestor direto ou com o RH.`,
                    },
                  },
                },
              ],
            },
          },
          {
            title: "Ferramentas do dia a dia",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Apresentação das ferramentas internas",
                  order: 0,
                  content: { create: { type: "SLIDES" } },
                },
                {
                  title: "Primeiros passos no e-mail corporativo",
                  order: 1,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `## Primeiros passos\n\n1. Acesse o e-mail corporativo com as credenciais enviadas pelo RH.\n2. Configure sua foto de perfil.\n3. Participe dos grupos do seu departamento.\n\n*Dúvidas? Procure o time de Tecnologia.*`,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // --- Curso 2: Segurança da Informação -------------------------------------------
  const securityCourse = await prisma.course.upsert({
    where: { id: "seed-course-security" },
    update: {},
    create: {
      id: "seed-course-security",
      title: "Segurança da Informação",
      description: "Boas práticas para proteger dados da empresa e dos clientes no dia a dia.",
      status: "PUBLISHED",
      categoryId: securityCat.id,
      createdById: admin.id,
      modules: {
        create: [
          {
            title: "Fundamentos de segurança",
            order: 0,
            lessons: {
              create: [
                {
                  title: "Senhas seguras",
                  order: 0,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `# Senhas seguras\n\nUma senha forte é a primeira linha de defesa contra acessos indevidos.\n\n## Boas práticas\n\n- Use ao menos 12 caracteres, combinando letras, números e símbolos.\n- Nunca reutilize a mesma senha em sistemas diferentes.\n- Use um gerenciador de senhas corporativo.\n- Ative a autenticação em duas etapas sempre que disponível.\n\n\`\`\`\nExemplo fraco: empresa123\nExemplo forte: Tr#94-Nuvem!Corvo\n\`\`\``,
                    },
                  },
                },
                {
                  title: "Identificando phishing",
                  order: 1,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `## O que é phishing?\n\nPhishing é uma tentativa de golpe por e-mail, mensagem ou site falso para roubar informações.\n\n### Sinais de alerta\n\n- Urgência excessiva ("aja agora ou sua conta será bloqueada").\n- Remetente com domínio estranho.\n- Links que não correspondem ao texto exibido.\n- Pedidos de senha ou dados bancários por e-mail.\n\nSe você suspeitar de uma mensagem, **não clique** e encaminhe para o time de Tecnologia.`,
                    },
                  },
                },
              ],
            },
          },
          {
            title: "Proteção de dados",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Classificação da informação",
                  order: 0,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `## Classificação da informação\n\n- **Pública**: pode ser divulgada livremente.\n- **Interna**: uso exclusivo dos colaboradores.\n- **Confidencial**: acesso restrito a áreas específicas.\n- **Restrita**: dados sensíveis de clientes e da empresa.\n\nSempre trate dados de clientes como, no mínimo, **confidenciais**.`,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // --- Curso 3: Boas práticas de atendimento --------------------------------------
  const supportCourse = await prisma.course.upsert({
    where: { id: "seed-course-support" },
    update: {},
    create: {
      id: "seed-course-support",
      title: "Boas práticas de atendimento",
      description: "Como oferecer um atendimento acolhedor, eficiente e alinhado com os valores da empresa.",
      status: "PUBLISHED",
      categoryId: supportCat.id,
      createdById: admin.id,
      modules: {
        create: [
          {
            title: "Comunicação com o cliente",
            order: 0,
            lessons: {
              create: [
                {
                  title: "Escuta ativa",
                  order: 0,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `# Escuta ativa\n\nEscutar ativamente significa entender de verdade o que o cliente está comunicando — não apenas esperar sua vez de falar.\n\n## Como praticar\n\n1. Deixe o cliente terminar de explicar antes de responder.\n2. Repita o problema com suas palavras para confirmar entendimento.\n3. Faça perguntas específicas quando algo não estiver claro.\n\n> Um cliente que se sente ouvido já está mais próximo de uma boa experiência.`,
                    },
                  },
                },
                {
                  title: "Tom de voz e empatia",
                  order: 1,
                  content: {
                    create: {
                      type: "MARKDOWN",
                      body: `## Tom de voz e empatia\n\nMesmo por escrito, o tom da conversa comunica muito.\n\n- Prefira frases afirmativas a negativas: "posso te ajudar com X" em vez de "não posso fazer Y".\n- Reconheça a frustração do cliente antes de explicar o processo.\n- Evite jargões técnicos internos.`,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // --- Atribuições de exemplo ------------------------------------------------------
  const allCourseIds = [onboardingCourse.id, securityCourse.id, supportCourse.id];
  for (const employee of employees) {
    for (const courseId of allCourseIds) {
      await prisma.courseAssignment.upsert({
        where: { userId_courseId: { userId: employee.id, courseId } },
        update: {},
        create: { userId: employee.id, courseId, assignedById: admin.id },
      });
    }
  }

  // --- Prova de exemplo (curso de Segurança da Informação) ----------------------
  const existingQuiz = await prisma.quiz.findUnique({ where: { courseId: securityCourse.id } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        courseId: securityCourse.id,
        title: "Prova final — Segurança da Informação",
        description: "Responda todas as questões. Um administrador corrige e libera a conclusão do curso.",
        passingScore: 60,
        maxAttempts: 3,
        questions: {
          create: [
            {
              type: "OBJECTIVE",
              prompt: "Qual das senhas abaixo é a mais segura?",
              points: 1,
              order: 0,
              options: {
                create: [
                  { text: "empresa123", isCorrect: false, order: 0 },
                  { text: "Tr#94-Nuvem!Corvo", isCorrect: true, order: 1 },
                  { text: "123456", isCorrect: false, order: 2 },
                  { text: "seunome2024", isCorrect: false, order: 3 },
                ],
              },
            },
            {
              type: "OBJECTIVE",
              prompt: "Ao receber um e-mail suspeito pedindo sua senha com urgência, você deve:",
              points: 1,
              order: 1,
              options: {
                create: [
                  { text: "Responder com a senha para não perder o acesso", isCorrect: false, order: 0 },
                  { text: "Clicar no link para verificar se é verdadeiro", isCorrect: false, order: 1 },
                  { text: "Não clicar e encaminhar para o time de Tecnologia", isCorrect: true, order: 2 },
                ],
              },
            },
            {
              type: "TEXT",
              prompt: "Descreva com suas palavras como você trataria um documento classificado como confidencial no dia a dia.",
              points: 2,
              order: 2,
            },
          ],
        },
      },
    });
  }

  console.log("Seed concluído.");
  console.log("Login administrador: admin@empresa.local / Admin@123");
  console.log("Login colaboradores (exemplo): ana.souza@empresa.local / Colaborador@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
