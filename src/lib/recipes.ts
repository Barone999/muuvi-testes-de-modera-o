import type { Phase } from "./cycle";

export interface Recipe {
  id: string;
  title: string;
  moment: "pre" | "pos";
  minutes: number;
  phases: Phase[];
  image: string;
  ingredients: string[];
  steps: string[];
}

const u = (id: string) => `https://images.unsplash.com/${id}?w=800&q=70`;

export const RECIPES: Recipe[] = [
  {
    id: "banana-aveia",
    title: "Banana com pasta de amendoim e aveia",
    moment: "pre",
    minutes: 5,
    phases: ["folicular", "ovulatoria"],
    image: u("photo-1571771894821-ce9b6c11b08e"),
    ingredients: ["1 banana", "1 colher (sopa) de pasta de amendoim", "1 colher (sopa) de aveia", "Canela a gosto"],
    steps: ["Corte a banana em rodelas.", "Espalhe a pasta de amendoim por cima.", "Finalize com aveia e canela."],
  },
  {
    id: "smoothie-frutas-vermelhas",
    title: "Smoothie de frutas vermelhas",
    moment: "pos",
    minutes: 5,
    phases: ["menstrual", "lutea"],
    image: u("photo-1553530666-ba11a7da3888"),
    ingredients: ["1 xícara de frutas vermelhas", "1 pote de iogurte natural", "1 colher (chá) de mel", "Gelo"],
    steps: ["Bata tudo no liquidificador.", "Sirva gelado logo em seguida."],
  },
  {
    id: "torrada-abacate",
    title: "Torrada com abacate e ovo",
    moment: "pos",
    minutes: 10,
    phases: ["folicular", "ovulatoria", "lutea"],
    image: u("photo-1525351484163-7529414344d8"),
    ingredients: ["1 fatia de pão integral", "1/2 abacate", "1 ovo", "Sal, limão e pimenta"],
    steps: ["Toste o pão.", "Amasse o abacate com sal e limão.", "Cozinhe o ovo e coloque por cima."],
  },
  {
    id: "chocolate-quente-cacau",
    title: "Bebida quente de cacau e canela",
    moment: "pos",
    minutes: 5,
    phases: ["menstrual", "lutea"],
    image: u("photo-1542990253-0d0f5be5f0ed"),
    ingredients: ["1 xícara de leite (ou vegetal)", "1 colher (sopa) de cacau 100%", "Canela", "Mel a gosto"],
    steps: ["Aqueça o leite.", "Misture o cacau, a canela e o mel até dissolver."],
  },
  {
    id: "tapioca-queijo",
    title: "Tapioca leve com queijo branco",
    moment: "pre",
    minutes: 10,
    phases: ["menstrual", "folicular"],
    image: u("photo-1600891964092-4316c288032e"),
    ingredients: ["3 colheres (sopa) de goma de tapioca", "Queijo branco a gosto", "Orégano"],
    steps: ["Espalhe a goma na frigideira quente.", "Quando firmar, recheie com queijo.", "Dobre e sirva."],
  },
  {
    id: "bowl-iogurte-granola",
    title: "Bowl de iogurte, granola e mamão",
    moment: "pre",
    minutes: 5,
    phases: ["ovulatoria", "lutea", "menstrual"],
    image: u("photo-1488477181946-6428a0291777"),
    ingredients: ["1 pote de iogurte natural", "2 colheres de granola", "Mamão picado", "Sementes de chia"],
    steps: ["Coloque o iogurte em uma tigela.", "Cubra com mamão, granola e chia."],
  },
];
