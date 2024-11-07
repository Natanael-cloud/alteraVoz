let gravador;
let blocosAudio = [];
let blobAudio;
let urlAudio;
let animacaoDisplay;
let intervaloTempo;
let segundosGravacao = 0;

const playerAudio = document.getElementById("playerAudio");
const botaoBaixar = document.getElementById("baixarAudio");
const botaoDescartar = document.getElementById("descartarGravacao");
const displayAudio = document.getElementById("displayAudio");
const contextoDisplay = displayAudio.getContext("2d");
const tempoGravacao = document.getElementById("tempoGravacao");

const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
const filtroGrave = contextoAudio.createBiquadFilter();
const filtroAgudo = contextoAudio.createBiquadFilter();
filtroGrave.type = "lowshelf";
filtroAgudo.type = "highshelf";

let vozRoboticaAtiva = false;

document.getElementById("iniciarGravacao").addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const fonteAudio = contextoAudio.createMediaStreamSource(stream);
    const analisador = contextoAudio.createAnalyser();
    analisador.fftSize = 256;

    fonteAudio.connect(filtroGrave).connect(filtroAgudo).connect(analisador);
    animacaoDisplay = requestAnimationFrame(() => desenharDisplay(analisador));

    segundosGravacao = 0;
    atualizarTempoGravacao();
    intervaloTempo = setInterval(() => {
        segundosGravacao++;
        atualizarTempoGravacao();
    }, 1000);

    gravador = new MediaRecorder(stream);
    gravador.ondataavailable = event => {
        blocosAudio.push(event.data);
    };

    gravador.onstop = async () => {
        blobAudio = new Blob(blocosAudio, { type: "audio/wav" });
        urlAudio = URL.createObjectURL(blobAudio);
        await processarAudioComFiltros(blobAudio);
        botaoBaixar.disabled = false;
        blocosAudio = [];
    };

    gravador.start();
    document.getElementById("iniciarGravacao").disabled = true;
    document.getElementById("pararGravacao").disabled = false;
    botaoDescartar.disabled = false;
});

document.getElementById("pararGravacao").addEventListener("click", () => {
    gravador.stop();
    cancelAnimationFrame(animacaoDisplay);
    limparDisplay();
    clearInterval(intervaloTempo);
    document.getElementById("iniciarGravacao").disabled = false;
    document.getElementById("pararGravacao").disabled = true;
});

botaoDescartar.addEventListener("click", () => {
    blocosAudio = [];
    urlAudio = null;
    playerAudio.src = "";
    botaoBaixar.disabled = true;
    botaoDescartar.disabled = true;
    limparDisplay();
    clearInterval(intervaloTempo);
    segundosGravacao = 0;
    atualizarTempoGravacao();
});

document.getElementById("velocidade").addEventListener("input", (evento) => {
    playerAudio.playbackRate = evento.target.value;
});

document.getElementById("grave").addEventListener("input", (evento) => {
    filtroGrave.frequency.value = 200;
    filtroGrave.gain.value = evento.target.value;
});

document.getElementById("agudo").addEventListener("input", (evento) => {
    filtroAgudo.frequency.value = 2000;
    filtroAgudo.gain.value = evento.target.value;
});

document.getElementById("vozRobotica").addEventListener("change", (evento) => {
    vozRoboticaAtiva = evento.target.checked;
});

botaoBaixar.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = urlAudio;
    a.download = "audio_gravado.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

function desenharDisplay(analisador) {
    const dadosAudio = new Uint8Array(analisador.frequencyBinCount);
    analisador.getByteFrequencyData(dadosAudio);

    contextoDisplay.clearRect(0, 0, displayAudio.width, displayAudio.height);

    const larguraBarra = displayAudio.width / dadosAudio.length;
    dadosAudio.forEach((valor, i) => {
        const alturaBarra = valor / 2;
        const x = i * larguraBarra;
        contextoDisplay.fillStyle = "#4CAF50";
        contextoDisplay.fillRect(x, displayAudio.height - alturaBarra, larguraBarra, alturaBarra);
    });

    animacaoDisplay = requestAnimationFrame(() => desenharDisplay(analisador));
}

function limparDisplay() {
    contextoDisplay.clearRect(0, 0, displayAudio.width, displayAudio.height);
}

function atualizarTempoGravacao() {
    const minutos = Math.floor(segundosGravacao / 60);
    const segundos = segundosGravacao % 60;
    tempoGravacao.textContent = `Tempo de gravação: ${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

async function processarAudioComFiltros(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = await contextoAudio.decodeAudioData(arrayBuffer);

    const bufferSource = contextoAudio.createBufferSource();
    bufferSource.buffer = buffer;

    if (vozRoboticaAtiva) {
        const oscilador = contextoAudio.createOscillator();
        oscilador.type = "square"; // Onda quadrada para efeito robótico
        oscilador.frequency.value = 40; // Frequência baixa para um efeito robótico característico

        const ganhoOscilador = contextoAudio.createGain();
        ganhoOscilador.gain.value = 0.5;

        oscilador.connect(ganhoOscilador).connect(filtroGrave).connect(filtroAgudo).connect(contextoAudio.destination);
        oscilador.start();
        bufferSource.connect(ganhoOscilador);
        
        bufferSource.start();
        bufferSource.onended = () => {
            oscilador.stop();
            playerAudio.src = urlAudio;
        };
    } else {
        bufferSource.connect(filtroGrave).connect(filtroAgudo).connect(contextoAudio.destination);
        bufferSource.start();
        bufferSource.onended = () => {
            playerAudio.src = urlAudio;
        };
    }
}


