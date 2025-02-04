async function send() {
  if (!window.editor) {
    console.error("El editor de Monaco no está inicializado.");
    return;
  }

  const prompt = window.editor.getValue(); // Obtener el valor del editor de Monaco
  const salidaDiv = document.getElementById("salida");
  const thinkDiv = document.getElementById("think");

  salidaDiv.innerHTML = '<em>Esperando respuesta...</em>';
  thinkDiv.innerHTML = '<em>Esperando respuesta...</em>';

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1:8b",
        prompt: prompt,
      })
    });

    salidaDiv.innerHTML = "";
    thinkDiv.innerHTML = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let think = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value, { stream: true });
      console.log(textChunk);

      try {
        const json = JSON.parse(textChunk);

        if (json.response) {
          if (json.response == "<think>") {
            think = true;
            continue;
          }

          if (think) {
            thinkDiv.innerHTML += json.response;
          } else {
            salidaDiv.innerHTML += json.response;
          }

          if (json.response == "</think>") {
            think = false;
            continue;
          }
        }

      } catch (e) {
        console.warn("Error al convertir en JSON", e);
      }

    }

  } catch (error) {
    salidaDiv.innerHTML = '<strong>Error:</strong> ' + error.message;
  }

}