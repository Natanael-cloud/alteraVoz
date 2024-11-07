// Variáveis principais para gravador de áudio, dados de áudio e display
let gravador; // Objeto para controlar a gravação de áudio
let blocosAudio = []; // Array para armazenar os fragmentos de áudio gravados
let blobAudio; // Objeto Blob que conterá o áudio completo
let urlAudio; // URL temporária para reproduzir o áudio
let animacaoDisplay; // Armazena o ID da animação para controle do display de áudio

// Referências aos elementos de áudio e botões do HTML
const playerAudio = document.getElementById("playerAudio"); // Elemento de áudio para reprodução
const botaoBaixar = document.getElementById("baixarAudio"); // Botão para baixar o áudio
const botaoDescartar = document.getElementById("descartarGravacao"); // Botão para descartar o áudio

// Configuração do display de visualização do áudio
const displayAudio = document.getElementById("displayAudio"); // Canvas para mostrar os níveis de áudio
const contextoDisplay = displayAudio.getContext("2d"); // Contexto 2D para desenhar no canvas

// Configuração do contexto de áudio e filtros de graves e agudos
const contextoAudio = new (window.AudioContext || window.webkitAudioContext)(); // Cria o contexto de áudio para manipulação do som
const filtroGrave = contextoAudio.createBiquadFilter(); // Filtro para ajuste de graves
const filtroAgudo = contextoAudio.createBiquadFilter(); // Filtro para ajuste de agudos

// Define o tipo dos filtros
filtroGrave.type = "lowshelf"; // Filtro de baixa frequência para graves
filtroAgudo.type = "highshelf"; // Filtro de alta frequência para agudos

// Inicia a gravação ao clicar no botão "Iniciar Gravação"
document.getElementById("iniciarGravacao").addEventListener("click", async () => {
    // Solicita permissão para capturar o áudio do microfone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const fonteAudio = contextoAudio.createMediaStreamSource(stream); // Fonte de áudio vinda do microfone
    const analisador = contextoAudio.createAnalyser(); // Cria o analisador para capturar dados de frequência
    analisador.fftSize = 256; // Define a resolução da análise de áudio

    // Conecta a fonte de áudio aos filtros e ao analisador
    fonteAudio.connect(filtroGrave).connect(filtroAgudo).connect(analisador);

    // Inicia a animação para mostrar o nível de áudio no display
    animacaoDisplay = requestAnimationFrame(() => desenharDisplay(analisador));

    // Inicializa o MediaRecorder com o stream de áudio
    gravador = new MediaRecorder(stream);

    // Evento que armazena os dados de áudio quando disponíveis
    gravador.ondataavailable = event => {
        blocosAudio.push(event.data); // Adiciona cada fragmento de áudio ao array
    };

    // Evento que ocorre quando a gravação é finalizada
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
    botaoDescartar.disabled = false; // Habilita o botão "Descartar Gravação"
});

// Para a gravação ao clicar no botão "Parar Gravação"
document.getElementById("pararGravacao").addEventListener("click", () => {
    gravador.stop(); // Finaliza a gravação
    cancelAnimationFrame(animacaoDisplay); // Para a animação do display de áudio
    limparDisplay(); // Limpa o display de áudio
    document.getElementById("iniciarGravacao").disabled = false; // Habilita o botão "Iniciar Gravação"
    document.getElementById("pararGravacao").disabled = true; // Desabilita o botão "Parar Gravação"
});

// Descartar a gravação ao clicar no botão "Descartar Gravação"
botaoDescartar.addEventListener("click", () => {
    blocosAudio = []; // Limpa os dados de áudio
    urlAudio = null; // Remove a URL de áudio
    playerAudio.src = ""; // Reseta o player de áudio
    botaoBaixar.disabled = true; // Desabilita o botão de download
    botaoDescartar.disabled = true; // Desabilita o botão de descartar
    limparDisplay(); // Limpa o display de áudio
});

// Controla a velocidade de reprodução do áudio
document.getElementById("velocidade").addEventListener("input", (evento) => {
    playerAudio.playbackRate = evento.target.value; // Ajusta a taxa de reprodução
});

// Controla o filtro de graves com base no controle deslizante
document.getElementById("grave").addEventListener("input", (evento) => {
    filtroGrave.frequency.value = 200; // Define a frequência de corte para o filtro de graves
    filtroGrave.gain.value = evento.target.value; // Ajusta o ganho do filtro de graves
});

// Controla o filtro de agudos com base no controle deslizante
document.getElementById("agudo").addEventListener("input", (evento) => {
    filtroAgudo.frequency.value = 2000; // Define a frequência de corte para o filtro de agudos
    filtroAgudo.gain.value = evento.target.value; // Ajusta o ganho do filtro de agudos
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

// Função para desenhar o display do áudio, visualizando o volume do áudio capturado
function desenharDisplay(analisador) {
    const dadosAudio = new Uint8Array(analisador.frequencyBinCount); // Array para armazenar os dados de frequência
    analisador.getByteFrequencyData(dadosAudio); // Popula o array com os dados de áudio

    contextoDisplay.clearRect(0, 0, displayAudio.width, displayAudio.height); // Limpa o display antes de desenhar

    // Desenha cada barra no display, representando os níveis de áudio
    const larguraBarra = displayAudio.width / dadosAudio.length;
    dadosAudio.forEach((valor, i) => {
        const alturaBarra = valor / 2; // Ajusta a altura da barra
        const x = i * larguraBarra; // Calcula a posição X da barra
        contextoDisplay.fillStyle = "#4CAF50"; // Define a cor da barra
        contextoDisplay.fillRect(x, displayAudio.height - alturaBarra, larguraBarra, alturaBarra); // Desenha a barra
    });

    animacaoDisplay = requestAnimationFrame(() => desenharDisplay(analisador)); // Continua a animação do display
}

// Função para limpar o display de áudio
function limparDisplay() {
    contextoDisplay.clearRect(0, 0, displayAudio.width, displayAudio.height); // Limpa o display de áudio
}

