// Variáveis para gravador de áudio e manipulação de dados de áudio
let gravador; // Objeto para controlar a gravação
let blocosAudio = []; // Array para armazenar os fragmentos de áudio gravados
let blobAudio; // Objeto Blob que conterá o áudio completo
let urlAudio; // URL temporária para reproduzir o áudio
const playerAudio = document.getElementById("playerAudio"); // Elemento de áudio para reprodução
const botaoBaixar = document.getElementById("baixarAudio"); // Botão para baixar o áudio

// Configuração do contexto de áudio e filtros para graves e agudos
const contextoAudio = new (window.AudioContext || window.webkitAudioContext)(); // Contexto de áudio para manipulação do som
const filtroGrave = contextoAudio.createBiquadFilter(); // Filtro para ajustar graves
const filtroAgudo = contextoAudio.createBiquadFilter(); // Filtro para ajustar agudos

// Configurações dos filtros de áudio
filtroGrave.type = "lowshelf"; // Filtro de baixa frequência para ajustar os graves
filtroAgudo.type = "highshelf"; // Filtro de alta frequência para ajustar os agudos

// Inicia a gravação ao clicar no botão "Iniciar Gravação"
document.getElementById("iniciarGravacao").addEventListener("click", async () => {
    // Solicita permissão para capturar o áudio do microfone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const fonteAudio = contextoAudio.createMediaStreamSource(stream); // Fonte de áudio do microfone
    
    // Conecta a fonte de áudio aos filtros e depois ao contexto de áudio
    fonteAudio.connect(filtroGrave).connect(filtroAgudo).connect(contextoAudio.destination);
    
    // Inicializa o MediaRecorder com o stream de áudio
    gravador = new MediaRecorder(stream);

    // Evento que captura os dados de áudio enquanto o gravador está ativo
    gravador.ondataavailable = event => {
        blocosAudio.push(event.data); // Armazena cada fragmento de áudio no array
    };

    // Evento disparado quando a gravação é finalizada
    gravador.onstop = () => {
        // Cria um Blob com os dados de áudio e gera uma URL para reprodução
        blobAudio = new Blob(blocosAudio, { type: "audio/wav" });
        urlAudio = URL.createObjectURL(blobAudio);
        playerAudio.src = urlAudio; // Define a URL no player para permitir a reprodução
        botaoBaixar.disabled = false; // Habilita o botão de download
        blocosAudio = []; // Limpa o array de fragmentos de áudio para a próxima gravação
    };

    // Inicia a gravação
    gravador.start();
    document.getElementById("iniciarGravacao").disabled = true; // Desabilita o botão "Iniciar Gravação"
    document.getElementById("pararGravacao").disabled = false; // Habilita o botão "Parar Gravação"
});

// Para a gravação ao clicar no botão "Parar Gravação"
document.getElementById("pararGravacao").addEventListener("click", () => {
    gravador.stop(); // Finaliza a gravação
    document.getElementById("iniciarGravacao").disabled = false; // Habilita o botão "Iniciar Gravação"
    document.getElementById("pararGravacao").disabled = true; // Desabilita o botão "Parar Gravação"
});

// Altera a velocidade de reprodução do áudio com base no valor do controle deslizante
document.getElementById("velocidade").addEventListener("input", (evento) => {
    playerAudio.playbackRate = evento.target.value; // Define a taxa de reprodução no player de áudio
});

// Controla o filtro de graves com base no valor do controle deslizante
document.getElementById("grave").addEventListener("input", (evento) => {
    filtroGrave.frequency.value = 200; // Define a frequência de corte para o filtro de graves
    filtroGrave.gain.value = evento.target.value; // Ajusta o ganho do filtro de graves conforme o valor do controle
});

// Controla o filtro de agudos com base no valor do controle deslizante
document.getElementById("agudo").addEventListener("input", (evento) => {
    filtroAgudo.frequency.value = 2000; // Define a frequência de corte para o filtro de agudos
    filtroAgudo.gain.value = evento.target.value; // Ajusta o ganho do filtro de agudos conforme o valor do controle
});

// Baixa o áudio gravado ao clicar no botão "Baixar Áudio"
botaoBaixar.addEventListener("click", () => {
    const a = document.createElement("a"); // Cria um elemento de link
    a.href = urlAudio; // Define o URL do áudio como destino do link
    a.download = "audio_gravado.wav"; // Define o nome do arquivo para download
    document.body.appendChild(a); // Adiciona o link ao documento
    a.click(); // Simula um clique para iniciar o download
    document.body.removeChild(a); // Remove o link do documento após o download
});
