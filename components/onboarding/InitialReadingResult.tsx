import React from "react";
import { Lock, RefreshCw, Bookmark, Sparkles, BookOpen } from "lucide-react";

interface InitialReadingResultProps {
  category: string;
  emotion: string;
  block: string;
  onOpenPlansModal: () => void;
  onReset: () => void;
}

interface InitialReadingData {
  preguntaCorta: string;
  titulo: string;
  explicacionNeville: string;
  lecturaComprobatoria: string;
  fraseDestacada: string;
  explicacionFrase: string;
  testimonioCompleto: string;
  cta: string;
}

const mockReadings: Record<string, InitialReadingData> = {
  "Dinero": {
    preguntaCorta: "¿Cómo pasar de la escasez a la posesión mental inmediata?",
    titulo: "La Consciencia de Abundancia como Única Realidad",
    explicacionNeville: "Neville Goddard nos recuerda que la abundancia es un estado de conciencia. Si buscas abundancia desde la necesidad o la urgencia, estás afirmando la carencia, y la Ley no puede darte otra cosa que no sea el reflejo de tu propia convicción. Para manifestar riqueza, debes habitar el sentimiento de que ya la posees, actuando y pensando desde la plenitud antes de ver cualquier cambio material.",
    lecturaComprobatoria: "En la lección de 'La Ley y la Promesa', Neville relata cómo el desapego al estado presente de deuda es el primer paso indispensable. Ignorar la realidad física es el acto de fe real.",
    fraseDestacada: "No te esfuerces por conseguir lo que deseas; asume el sentimiento de que ya lo tienes.",
    explicacionFrase: "Esta frase ilustra que la lucha externa es inútil si internamente sigues sintiéndote limitado. El cambio es un giro psicológico, no físico.",
    testimonioCompleto: "Al reestructurar el estado financiero ante un pago urgente: 'Ante la cercanía de un vencimiento de alquiler sin fondos disponibles, decidí ignorar la reacción de pánico. Al irme a dormir, imaginé entregar el dinero con una sonrisa, sintiendo el alivio en mi pecho y durmiendo en esa asunción. Al día siguiente, un cliente del año pasado me contactó para contratar un servicio urgente y pagó por adelantado.'",
    cta: "Comenzá hoy mismo a reestructurar tu relación con la abundancia."
  },
  "Amor / relaciones": {
    preguntaCorta: "¿Cómo ser amado y deseado por quien anhelas?",
    titulo: "La Ley del Respeto Propio y la Unión Imaginaria",
    explicacionNeville: "Neville explica que los demás son solo mensajeros de lo que crees que eres. Si te sientes rechazado, abandonado o no correspondido, el mundo exterior simplemente sostiene ese reflejo. Debes asumir en tu imaginación que ya eres amado, valorado y elegido, sintiendo el abrazo y escuchando las palabras de confirmación de tu deseo ya cumplido.",
    lecturaComprobatoria: "En 'El Poder de la Conciencia', se demuestra cómo el concepto propio determina el comportamiento de los demás hacia ti. Cambia tu concepto propio y transformarás tu relación.",
    fraseDestacada: "Nadie viene a ti a menos que tú lo llames desde tu estado de conciencia.",
    explicacionFrase: "Esto significa que no debes intentar forzar a la otra persona a cambiar. Modifica tu diálogo interno sobre cómo te valoran y ellos cambiarán de forma natural.",
    testimonioCompleto: "Al reestructurar una relación distanciada: 'Después de meses de distancia en la pareja, decidí dejar de reclamar y de repetir la vieja historia. En cambio, cada noche imaginaba escuchar su voz diciéndome cuánto me valoraba. Sostuve esa escena sintiéndola real. A las dos semanas, la comunicación se reanudó de forma natural con una propuesta de reencuentro.'",
    cta: "Comenzá tu transformación de relaciones desde tu interior."
  },
  "Salud / cuerpo": {
    preguntaCorta: "¿Es posible manifestar vitalidad física desde la mente?",
    titulo: "La Reconstrucción del Bienestar a través del Sentimiento",
    explicacionNeville: "Neville sostiene que el cuerpo físico es un reflejo de tus asunciones habituales. Sostener pensamientos de debilidad mantiene al cuerpo atrapado en ese estado. Debes ignorar los síntomas físicos actuales y contemplarte mentalmente en un estado de perfecta vitalidad, bienestar y plenitud.",
    lecturaComprobatoria: "En 'Fe en Dios', Neville relata casos de bienestar donde la persona se negó a aceptar la apariencia de debilidad en su mente, asumiendo una vitalidad completa.",
    fraseDestacada: "Ignora la evidencia de los sentidos y camina en la asunción de que ya estás sano.",
    explicacionFrase: "Prestarle atención constante al dolor o al síntoma lo solidifica. La imaginación debe habitar el estado de alivio y vitalidad.",
    testimonioCompleto: "Al enfocar la vitalidad corporal frente al malestar recurrente: 'Al experimentar malestares crónicos semanales, comencé a sentarme todas las mañanas visualizándome con total vitalidad, corriendo al aire libre y sintiendo frescura en la mente, dejando de hablar del malestar con los demás. Con los días la mente se estabilizó y la vitalidad retornó por completo.'",
    cta: "Asumí tu estado de vitalidad y bienestar hoy."
  },
  "Propósito": {
    preguntaCorta: "¿Cómo atraer el trabajo ideal y el éxito profesional?",
    titulo: "La Asunción del Éxito Laboral y la Contribución Real",
    explicacionNeville: "El éxito y la vocación no se consiguen compitiendo, sino asumiendo el estado de que ya eres exitoso y estás aportando valor. La imaginación debe adelantarse a los hechos: vete a la cama sintiéndote realizado, felicitado por tus compañeros de trabajo o tus clientes, y la realidad acomodará las circunstancias para que ese empleo aparezca.",
    lecturaComprobatoria: "En 'La Causa Creativa', se detalla cómo el sentimiento de ser útil y próspero atrae de inmediato las propuestas y oportunidades adecuadas.",
    fraseDestacada: "Vete al final y habita la escena en la que ya eres reconocido y próspero.",
    explicacionFrase: "No busques el 'cómo' se dará el trabajo. Siente la satisfacción de que ya es tuyo y deja que los medios se organicen solos.",
    testimonioCompleto: "Al buscar el propósito laboral y cambiar de empleo: 'Frente al estancamiento laboral, empecé a imaginarme en una oficina moderna, firmando un acuerdo desafiante y estrechando manos, sintiendo el orgullo del logro. En menos de un mes, un reclutador me contactó ofreciéndome exactamente ese rol.'",
    cta: "Da el paso hacia tu verdadera vocación desde tu imaginación."
  },
  "Paz mental": {
    preguntaCorta: "¿Cómo disolver la duda y la ansiedad de forma inmediata?",
    titulo: "El Silencio de la Mente y el Templo de la Asunción",
    explicacionNeville: "Neville enseña que la inquietud proviene de habitar mentalmente estados futuros de fracaso. Al calmar tu respiración y reclamar tu presencia interior consciente, te desapegas del miedo y regresas al momento presente, donde eres el creador supremo de tu paz. La paz mental no depende de que el mundo se arregle, sino de tu silencio interno.",
    lecturaComprobatoria: "En 'El Silencio del Alma', se explica que la claridad no habla en el torbellino de pensamientos ansiosos, sino en el silencio de la asunción perfecta.",
    fraseDestacada: "Quédate quieto y sabe que yo soy Dios.",
    explicacionFrase: "Esta instrucción interpretada por Neville nos pide detener la marcha de la mente preocupada y descansar en la certeza de que nuestra conciencia resolverá todo.",
    testimonioCompleto: "Al aquietar el estado de ansiedad nocturna: 'Sufriendo de inquietud recurrente por el futuro, aprendí a repetir en silencio la palabra \"Paz\" sintiéndome envuelta en luz, rechazando todo pensamiento contrario. En pocos días mi mente se aquietó y las soluciones llegaron solas.'",
    cta: "Reclamá tu paz interior y desactivá la duda."
  },
  "Identidad / Yo Soy": {
    preguntaCorta: "¿Cómo reprogramar tu identidad limitante de raíz?",
    titulo: "El Despertar del Yo Soy: Tu Concepto Propio Verdadero",
    explicacionNeville: "La identidad es el molde de toda tu vida. Si te defines a ti mismo como desafortunado o débil, tu mundo expresará eso. Neville explica que la asunción más profunda es cambiar tu concepto de ti mismo: declarar 'Yo Soy fuerte', 'Yo Soy amado', 'Yo Soy suficiente' sin necesidad de pruebas físicas iniciales, sosteniéndolo con lealtad radical.",
    lecturaComprobatoria: "En 'Vivir desde el Final', Neville demuestra que la autodefinición consciente es el único poder creativo. Eres lo que asumes ser.",
    fraseDestacada: "Cambiar tu concepto de ti mismo es el único camino para cambiar tu mundo.",
    explicacionFrase: "No intentes modificar las piezas de tu vida una a una. Cambia el observador (tú mismo) y todas las piezas cambiarán de lugar automáticamente.",
    testimonioCompleto: "Al renovar el concepto del Yo Soy y el merecimiento: 'Habiendo experimentado baja autoestima, comencé a repetir cada noche antes de dormir: \"Yo Soy valioso, Yo Soy amado, Yo Soy suficiente\". Al principio se sentía extraño, pero persistí hasta sentirlo natural. Toda mi actitud cambió y mi entorno comenzó a tratarme con un respeto enorme.'",
    cta: "Reescribí tu identidad y convertite en quien querés ser."
  }
};

const defaultReading: InitialReadingData = {
  preguntaCorta: "¿Cómo pasar de la sensación de carencia a la de posesión inmediata?",
  titulo: "La Ley del Sentimiento y la Consciencia de Abundancia",
  explicacionNeville: "Neville Goddard sostiene que tu deseo no es algo a conseguir afuera, sino un reflejo de tu estado interno. Si tu conciencia está fijada en la carencia o en la urgencia, el mundo exterior no tendrá más opción que reflejarte escasez. Para cambiar el reflejo, debes cambiar tu autodefinición interna antes de ver cualquier resultado físico.",
  lecturaComprobatoria: "En 'El Arte de Morir', se detalla cómo el desapego del estado actual es imprescindible. No mueres físicamente, sino que mueres a la vieja historia y naces al sentimiento de que tu deseo ya se ha cumplido.",
  fraseDestacada: "No intentes cambiar el espejo; cambia la cara que se refleja en él.",
  explicacionFrase: "Esto significa que cualquier esfuerzo por forzar las circunstancias externas sin cambiar primero el concepto que tienes de ti mismo es completamente inútil. El cambio debe ocurrir en la imaginación.",
  testimonioCompleto: "Al desactivar la sensación de deuda y escasez: 'Con una obligación financiera inminente, tras comprender que debía vivir desde el final, me senté en silencio e imaginé que firmaba el recibo de pago con absoluta paz, sintiendo el alivio en mi pecho. Tres días después, un cliente inesperado contrató un servicio por un valor equivalente.'",
  cta: "El primer paso para cambiar tu realidad es retirar tu atención del problema e iniciar tu práctica."
};

const BLOCKED_ACTIONS = [
  "Crear mi escena imaginaria",
  "Armar mi práctica de 24 horas",
  "Empezar plan de 7 días",
  "Hablar con mi compañero de imaginación",
  "Crear mi libro personal"
];

export default function InitialReadingResult({
  category,
  emotion,
  block,
  onOpenPlansModal,
  onReset
}: InitialReadingResultProps) {
  const reading = mockReadings[category] || defaultReading;

  return (
    <div style={{
      width: "100%",
      maxWidth: "760px",
      border: "4px solid var(--swiss-border)",
      backgroundColor: "var(--swiss-bg)",
      padding: "40px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      position: "relative",
      borderRadius: "22px"
    }}>
      {/* Botón de reinicio */}
      <button
        onClick={onReset}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "none",
          border: "2px solid var(--swiss-border)",
          padding: "6px 12px",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderRadius: "22px"
        }}
      >
        <RefreshCw size={10} />
        Volver a empezar
      </button>

      {/* 1. Pregunta corta */}
      <div style={{ borderBottom: "4px solid var(--swiss-border)", paddingBottom: "24px" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-accent)", letterSpacing: "0.1em" }}>
          Primera Lectura de Estado
        </span>
        <p style={{ fontSize: "16px", fontWeight: 700, fontStyle: "italic", marginTop: "8px", color: "var(--swiss-fg)" }}>
          &ldquo;{reading.preguntaCorta}&rdquo;
        </p>
      </div>

      {/* 2. Título */}
      <div>
        <h2 style={{ fontSize: "36px", fontWeight: 900, textTransform: "uppercase", lineHeight: "1", letterSpacing: "-0.02em" }}>
          {reading.titulo}
        </h2>
        {/* 3. Etiquetas */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
          <span style={{ fontSize: "10px", fontWeight: 900, padding: "4px 10px", border: "2px solid var(--swiss-border)", textTransform: "uppercase", borderRadius: "22px" }}>
            {category}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 900, padding: "4px 10px", border: "2px solid var(--swiss-border)", textTransform: "uppercase", backgroundColor: "var(--swiss-muted)", borderRadius: "22px" }}>
            {emotion}
          </span>
          <span style={{ fontSize: "10px", fontWeight: 900, padding: "4px 10px", border: "2px solid var(--swiss-border)", textTransform: "uppercase", backgroundColor: "var(--swiss-accent)", color: "#FFFFFF", borderRadius: "22px" }}>
            {block}
          </span>
        </div>
      </div>

      {/* 4. Explicación de Neville */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Bookmark size={12} />
          La Doctrina de Neville Goddard
        </h3>
        <p style={{ fontSize: "14px", lineHeight: "1.6", fontWeight: 500, color: "var(--swiss-fg)" }}>
          {reading.explicacionNeville}
        </p>
      </div>

      {/* 5. Lectura que lo comprueba */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <BookOpen size={12} />
          Lectura Comprobatoria
        </h3>
        <p style={{ fontSize: "14px", lineHeight: "1.6", fontWeight: 500, color: "var(--swiss-fg)" }}>
          {reading.lecturaComprobatoria}
        </p>
      </div>

      {/* 6. Frase literal destacada */}
      <blockquote style={{
        borderLeft: "6px solid var(--swiss-accent)",
        backgroundColor: "var(--swiss-muted)",
        padding: "20px 24px",
        margin: "12px 0",
        fontStyle: "italic",
        fontSize: "16px",
        fontWeight: 700,
        color: "var(--swiss-fg)",
        lineHeight: "1.4",
        borderTopRightRadius: "22px",
        borderBottomRightRadius: "22px"
      }}>
        &ldquo;{reading.fraseDestacada}&rdquo;
      </blockquote>

      {/* 7. Explicación de la frase */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ fontSize: "13.5px", lineHeight: "1.6", fontWeight: 500, color: "var(--swiss-fg)" }}>
          {reading.explicacionFrase}
        </p>
      </div>

      {/* 8. Testimonio completo */}
      <div style={{
        border: "3px solid var(--swiss-border)",
        padding: "24px",
        backgroundColor: "var(--swiss-bg)",
        borderRadius: "22px"
      }}>
        <h4 style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px", color: "var(--swiss-text-muted)" }}>
          Caso de Éxito en la Práctica
        </h4>
        <p style={{ fontSize: "13px", lineHeight: "1.6", fontWeight: 500, fontStyle: "italic", color: "var(--swiss-fg)" }}>
          {reading.testimonioCompleto}
        </p>
      </div>

      {/* 9. CTA */}
      <div style={{
        backgroundColor: "var(--swiss-fg)",
        color: "var(--swiss-bg)",
        padding: "20px",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "14px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderRadius: "22px"
      }}>
        {reading.cta}
      </div>

      {/* 10. Acciones bloqueadas */}
      <div style={{
        borderTop: "4px solid var(--swiss-border)",
        paddingTop: "32px",
        marginTop: "16px"
      }}>
        <h3 style={{
          fontSize: "14px",
          fontWeight: 900,
          textTransform: "uppercase",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Lock size={16} style={{ color: "var(--swiss-accent)" }} />
          Acciones Recomendadas (Bloqueadas)
        </h3>
        <p style={{ fontSize: "12px", color: "var(--swiss-text-muted)", marginBottom: "20px", fontWeight: 500 }}>
          Para activar estas herramientas y empezar a trabajar este deseo, accedé a un plan de Imaginalia:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {BLOCKED_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={onOpenPlansModal}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                border: "2px dashed var(--swiss-border)",
                backgroundColor: "transparent",
                color: "var(--swiss-fg)",
                fontSize: "13px",
                fontWeight: 700,
                textAlign: "left",
                cursor: "pointer",
                opacity: 0.8,
                transition: "all 0.15s ease-out",
                borderRadius: "22px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--swiss-muted)";
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.opacity = "0.8";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={14} style={{ color: "var(--swiss-accent)" }} />
                {action}
              </span>
              <Lock size={14} style={{ color: "var(--swiss-text-muted)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
