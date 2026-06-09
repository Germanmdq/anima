import React from "react";
import PortalCard from "./PortalCard";
import { MessageSquareText, Sparkles, HelpCircle, BookOpen, Calendar, Send, FileText, Library, History, StickyNote, ScrollText, Cross } from "lucide-react";

interface ImaginaliaPortalProps {
  variant: "public" | "dashboard";
  onSelectTab: (tab: string, agent?: string) => void;
}

export default function ImaginaliaPortal({
  variant,
  onSelectTab
}: ImaginaliaPortalProps) {
  const cards = [
    {
      num: "01",
      title: "Coach",
      excerpt: "Trabajá tu deseo con una guía directa.",
      desc: "Escribí tu deseo, duda o situación y recibí orientación práctica para volver al estado elegido.",
      icon: <MessageSquareText size={18} />,
      action: () => onSelectTab("aula", "profesor")
    },
    {
      num: "02",
      title: "Narrador",
      excerpt: "Recibí explicaciones vivas, ejemplos y escenas guiadas.",
      desc: "Una forma más simbólica, clara y emocional de entender una enseñanza, una escena o un deseo.",
      icon: <Sparkles size={18} />,
      action: () => onSelectTab("narrador")
    },
    {
      num: "03",
      title: "Testimonios y casos",
      excerpt: "Conocé historias que Neville usaba para mostrar la Ley en acción.",
      desc: "Casos sobre dinero, relaciones, revisión, trabajo, objetos recuperados, cambios de estado y experiencias concretas.",
      icon: <ScrollText size={18} />,
      action: () => onSelectTab("testimonios")
    },
    {
      num: "04",
      title: "Biblia metafísica",
      excerpt: "Entendé los símbolos bíblicos desde la lectura psicológica de Neville.",
      desc: "Cristo, Moisés, Josué, David, Jacob, Esaú, Judas, Jerusalén, Egipto, Promesa, Resurrección y Yo Soy como estados y símbolos de conciencia.",
      icon: <Cross size={18} />,
      action: () => onSelectTab("biblico")
    },
    {
      num: "05",
      title: "Preguntas y respuestas",
      excerpt: "Integrá conceptos y descubrí qué entendiste realmente.",
      desc: "Generá preguntas sobre una charla, una lectura, una escena, una entrada del diario, un plan o una enseñanza.",
      icon: <HelpCircle size={18} />,
      action: () => onSelectTab("examenes")
    },
    {
      num: "06",
      title: "Mi libro",
      excerpt: "Convertí tus charlas, escenas, planes y aprendizajes en un libro propio.",
      desc: "Todo lo que trabajás puede ordenarse como capítulos, prácticas, escenas, preguntas y reflexiones.",
      icon: <BookOpen size={18} />,
      action: () => onSelectTab("libro")
    },
    {
      num: "07",
      title: "Planes",
      excerpt: "Practicá durante 7, 15 o 30 días.",
      desc: "Convertí un deseo, una charla, una escena o un bloqueo en un camino diario para sostener un estado.",
      icon: <Calendar size={18} />,
      action: () => onSelectTab("planes")
    },
    {
      num: "08",
      title: "Telegram",
      excerpt: "Recibí mensajes personalizados durante el día.",
      desc: "Frases de retorno, pequeñas prácticas y recordatorios según el deseo que estés trabajando.",
      icon: <Send size={18} />,
      action: () => onSelectTab("telegram")
    },
    {
      num: "09",
      title: "Diario íntimo",
      excerpt: "Guardá tus estados, escenas, reacciones y cambios internos.",
      desc: "Un espacio privado para registrar cómo estás practicando y ver tu transformación con el tiempo.",
      icon: <FileText size={18} />,
      action: () => onSelectTab("diario")
    },
    {
      num: "10",
      title: "Memoria",
      excerpt: "Todo lo que Odiseo recuerda de tu proceso.",
      desc: "Deseos trabajados, estados observados, escenas creadas, planes activos, entradas del diario, mensajes de Telegram, capítulos del libro y conversaciones importantes.",
      icon: <History size={18} />,
      action: () => onSelectTab("memoria")
    },
    {
      num: "11",
      title: "Notas",
      excerpt: "Leé ideas breves y trabajalas dentro de Odiseo.",
      desc: "Notas prácticas basadas en Neville que podés convertir en plan, pregunta, diario, conversación o capítulo de tu libro.",
      icon: <StickyNote size={18} />,
      action: () => onSelectTab("notas")
    },
    {
      num: "12",
      title: "Fuentes de Neville",
      excerpt: "Conferencias, libros y lecciones que alimentan las respuestas y prácticas.",
      desc: "La base interna que sostiene el Coach, el Narrador, los testimonios, la Biblia metafísica, las preguntas, los planes y las notas.",
      icon: <Library size={18} />,
      action: () => onSelectTab("biblioteca")
    }
  ];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "40px" }}>
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "24px",
          width: "100%"
        }}
      >
        {cards.map((card, i) => (
          <PortalCard
            key={i}
            num={card.num}
            title={card.title}
            excerpt={card.excerpt}
            desc={card.desc}
            icon={card.icon}
            onEnter={card.action}
          />
        ))}
      </div>
    </div>
  );
}
