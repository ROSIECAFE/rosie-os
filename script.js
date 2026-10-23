
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const windows = $$('.window');
  const startMenu = $('#start-menu');
  const output = $('#terminal-output');
  const input = $('#terminal-input');
  const toast = $('#toast');
  const taskButtons = $('#task-buttons');
  const SAVE_KEY = 'rosieOS23.save';
const LEGACY_KEYS = [
  'rosieOS22.save',
  'rosieOS21.save'
];
  
  // ROSIE OS: áudio e efeitos sonoros
  const SOUND_KEY = 'rosieOS22.sound';
  let soundEnabled = false;
  let audioContext = null;

  try {
    soundEnabled = localStorage.getItem(SOUND_KEY) === 'on';
  } catch (e) {}

  function getAudioContext() {
    if (!audioContext) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioClass) return null;
      audioContext = new AudioClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  }

  function playTone(frequency = 660, duration = 0.07, type = 'square', volume = 0.025) {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function playSound(name) {
    if (!soundEnabled) return;

    // Arquivos opcionais: se não existirem, usamos sons sintetizados.
    const soundFiles = {
      boot: 'sounds/boot.mp3',
      open: 'sounds/open.wav',
      close: 'sounds/close.wav',
      terminal: 'sounds/terminal.wav',
      alert: 'sounds/alert.wav'
    };

    const fallback = {
      boot: [[440, 0.12], [660, 0.14], [880, 0.20]],
      open: [[660, 0.05], [880, 0.06]],
      close: [[620, 0.05], [420, 0.08]],
      terminal: [[720, 0.04]],
      alert: [[440, 0.13], [330, 0.18]]
    };

    let usedFallback = false;

    const useFallback = () => {
      if (usedFallback) return;
      usedFallback = true;

      (fallback[name] || []).forEach(([frequency, duration], index) => {
        setTimeout(() => playTone(frequency, duration), index * 115);
      });
    };

    const audio = new Audio(soundFiles[name] || '');
    audio.volume = 0.35;
    audio.onerror = useFallback;

    const playback = audio.play();

    if (playback && typeof playback.catch === 'function') {
      playback.catch(useFallback);
    }
  }

  function setSoundEnabled(enabled) {
    soundEnabled = enabled;

    try {
      localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
    } catch (e) {}

    const button = $('#boot-sound');

    if (button) {
      button.textContent = enabled ? '♫ Som: ligado' : '♫ Som: desligado';
      button.setAttribute('aria-pressed', String(enabled));
    }

    if (enabled) {
      getAudioContext();
      playTone(660, 0.08);
    }
  }
  let zIndex = 5;
  let toastTimer;
  const discovered = new Set();
  const unlockedApps = new Set();
  let savedState = { discovered: [], unlockedApps: [], trashChecked: false };
  let accessLevel = 'JUNK';
  let fisherBugsFound = 0;
  let fisherPasswordKnown = false;
  let promotedToLindy = false;
  let cameraIndex = 0;
  const cameraNames = [
    'CAM-01 · PALCO PRINCIPAL', 'CAM-02 · SALÃO', 'CAM-03 · COZINHA',
    'CAM-04 · CORREDOR LESTE', 'CAM-05 · CORREDOR OESTE', 'CAM-06 · SALA DE JOGOS',
    'CAM-07 · DEPÓSITO', 'CAM-08 · ÁREA EXTERNA'
  ];

  const docs = {
    'welcome.txt': `ROSIE CAFÉ CORPORATION

Seja bem-vindo à família Rosie!

Nossa missão é tornar cada pausa mais doce. A qualidade começa nos pequenos detalhes: um sorriso, uma mesa limpa e um relatório preenchido corretamente.

Lembrete: sua conta atual possui acesso JUNK. Consulte seu supervisor para solicitar permissões adicionais.

Tenha um excelente turno!`,
    'cafe_rules.txt': `ROSIE CAFÉ — REGRAS DA CASA
Versão pública 2.2

1. Trate todos os clientes com gentileza.
2. Registre perdas e ocorrências no fim do turno.
3. Não entre em áreas sinalizadas como RESTRITO.
4. Não desligue equipamentos sem autorização.
5. Se ouvir o telefone tocar em uma sala vazia, informe a supervisão.

A regra 5 foi incluída por solicitação do departamento de operações.
Não é necessário perguntar o motivo.`,
    'company_info.txt': `ROSIE CAFÉ CORPORATION

Fundação: registro interno indisponível
Direção: Nathan [sobrenome omitido]
Coordenação de projetos: Christopher
Departamento: Operações e Experiência

A Rosie Café cresceu graças à dedicação de pessoas que acreditam em um ambiente acolhedor. Nossos parques, cafés e espaços de entretenimento devem ser seguros, alegres e memoráveis.

Nota administrativa: documentos de manutenção não fazem parte do pacote JUNK.`,
    'staff_memo.txt': `MEMORANDO INTERNO
Para: equipe de apoio
De: Christopher

Por favor, mantenham as cópias dos relatórios em ordem cronológica. Nathan quer que a inauguração seja impecável.

Uma observação: o arquivo de inventário voltou a aparecer depois de ter sido removido. A equipe de TI diz que é um erro de sincronização. Não percam tempo com isso.

— Christopher`,
    'maintenance.log': `[LOG DE MANUTENÇÃO — CÓPIA PARCIAL]

03:14:08 | Unidade C-04 reiniciada sem solicitação.
03:14:11 | Áudio detectado em corredor vazio.
03:14:12 | Operador: "Quem está aí?"
03:14:14 | Áudio detectado novamente.
03:14:15 | Operador encerrou a sessão.
03:14:16 | SISTEMA: não havia operador conectado.

[REGISTRO INTERROMPIDO]

Nota: este documento não deveria estar visível para o nível JUNK.`,
    'incident_04.txt': `INCIDENTE 04 — ACESSO RESTRITO

O relatório oficial descreve o evento como uma falha elétrica de curta duração.

A cópia de segurança contém uma linha adicional:
"Ela sabia o nome do funcionário antes que ele se apresentasse."

A linha foi removida da versão enviada à diretoria.

Se este arquivo apareceu na sua pasta, não o mova para a rede compartilhada.

FIM DO DOCUMENTO`,
    'archived_mail.txt': `MENSAGEM ARQUIVADA
Remetente: [REMOVIDO]
Data: 17/10 — horário não sincronizado
Assunto: O diretório que não existe

Christopher,

A pasta voltou. Eu apaguei três vezes, e ela continua surgindo depois das 03:14. Desta vez havia um arquivo com meu nome. Não abri.

Por favor, não diga que é outro problema de sincronização.

— N.`,
    'mechanic_statement_07.txt': `DECLARAÇÃO TÉCNICA 07
Autora: Evelyn Hart, manutenção
Estado: cópia recuperada parcialmente

Terminei a preparação de Beth e Croko e registrei os resultados no catálogo Animatronics. Os quatro tipos de consulta continuam disponíveis no sistema antigo, embora não apareçam no menu padrão.

Animatronics Logs — lista de unidades registradas.
Animatronics [Nome] — ficha individual.
Animatronics Diagnostics — relatórios técnicos.
Animatronics Incidents — ocorrências e anexos.

Não consegui explicar por que alguns registros foram alterados depois de assinados. Se esta cópia reapareceu, mantenham-na fora da pasta compartilhada.

E. Hart`,
    'animatronics_logs.txt': `CATÁLOGO DE ANIMATRÔNICOS
Unidade: Pensilvânia
Estado: índice parcial

Registros recuperados: Rosie The Fox; Charles The Wolf; Beth The Spider; Croko The Crocodile; Lindy; Junk.

Algumas fichas exigem uma consulta individual. Os registros de incidentes não estão anexados a este índice.

[FIM DO EXTRATO]`,
    'rosie_vision.pkg': `ROSIE VISION 0.7B
Pacote recuperado pelo sistema.

O manifesto está incompleto. A aplicação de monitoramento foi instalada, mas nenhuma câmera respondeu ao teste de conexão.

Nota do operador: "A câmera do corredor estava desligada. Eu vi a imagem mesmo assim."

[MANIFESTO ENCERRADO]`
  };


  const testimonies = {
    guarda: {
      title: 'DEPOIMENTO 01 — GUARDA NOTURNA (1998)',
      text: `DEPOIMENTO 01 — GUARDA NOTURNA
Data: 17/02/1998
Local: Rosie Café, palco principal

Durante o turno da noite, ouvi barulhos vindos do palco principal. Quando fui verificar, os animatrônicos estavam se ativando sozinhos, apesar de a área estar fechada.

O Fisher.exe estava instalado no terminal de descanso. A senha que eu usava era Bubbli, mas naquela noite o aplicativo começou a rejeitar meu acesso. Não alterei a senha e não havia ninguém autorizado na sala.

O relatório foi encaminhado à supervisão. Não recebi resposta.

[FIM DO DEPOIMENTO]`
    },
    manutencao: {
      title: 'DEPOIMENTO 02 — TÉCNICA DE MANUTENÇÃO',
      text: `DEPOIMENTO 02 — TÉCNICA DE MANUTENÇÃO
Data: registro incompleto

A unidade de manutenção confirmou que o palco estava sem alimentação principal. Mesmo assim, os registros indicam pequenos movimentos entre as verificações. A equipe atribuiu o ocorrido a uma falha de sincronização.

Solicitei que a gravação fosse preservada. O arquivo não estava mais no diretório na manhã seguinte.

[FIM DO DEPOIMENTO]`
    },
    cozinha: {
      title: 'DEPOIMENTO 03 — FUNCIONÁRIO DA COZINHA',
      text: `DEPOIMENTO 03 — FUNCIONÁRIO DA COZINHA
Data: outubro de 1998

Ouvi uma melodia vindo da sala de jogos depois do fechamento. Pensei que fosse um dos alto-falantes, mas o painel de áudio estava desligado. Quando avisei a supervisão, me disseram para registrar o turno e não voltar àquela sala sozinho.

No dia seguinte, ninguém encontrou o registro de áudio.

[FIM DO DEPOIMENTO]`
    }
  };

  const animatronics = {
    'rosie the fox': {
      title: 'ROSIE THE FOX',
      description: `Apresentadora principal e responsável pelas demonstrações de confeitaria. Projetada para interagir com visitantes e conduzir atividades no palco.

NOTA DA EQUIPE: alguns comandos parecem não produzir resposta durante testes com adultos. O mesmo comando funcionou em uma festa infantil. A diferença ainda não foi explicada.`
    },
    'charles the wolf': {
      title: 'CHARLES THE WOLF',
      description: `Vocalista e coapresentador. Irmão de Rosie no desenho institucional, conhecido pelo humor expansivo.

NOTA DA EQUIPE: falhas seletivas de resposta foram registradas em testes de rotina. Evitar alterar o roteiro sem autorização de Operações.`
    },
    'beth the spider': {
      title: 'BETH THE SPIDER',
      description: `Unidade planejada para interagir com elementos específicos do espaço infantil. O sistema de reconhecimento ocasionalmente classifica crianças como objetos do cenário.

NOTA DA EQUIPE: restringir os testes e encaminhar qualquer ocorrência ao supervisor.`
    },
    'croko the crocodile': {
      title: 'CROKO THE CROCODILE',
      description: `Animatrônico sem pernas, mantido dentro de um barril durante apresentações. Repete sua canção em ciclos curtos.

NOTA DA EQUIPE: funcionários relataram que algumas crianças seguem a música até a sala de Croko quando não há outros adultos por perto. O relatório completo não acompanha esta ficha.`
    },
    'lindy': {
      title: 'LINDY',
      description: `Assistente humanoide responsável por entregar pedidos, anotar solicitações e transmitir recados à cozinha.

NOTA DA EQUIPE: foram relatados episódios em que Lindy fala de flores, recita poemas ou menciona o ano de 1997 sem contexto aparente.`
    },
    'junk': {
      title: 'JUNK',
      description: `Personagem de apoio representado por uma pequena lata de lixo rabugenta. Diversas unidades Mini Junk são distribuídas pelo estabelecimento.

NOTA DA EQUIPE: as unidades foram encontradas fora de suas posições após o fechamento. Não há registro de movimentação autorizado para esse período.`
    }
  };

  const diagnostics = {
    'rosie the fox': `DIAGNÓSTICO — ROSIE THE FOX
Estado nominal: operacional
Falhas de comando: intermitentes
Último teste registrado: resultado inconsistente
Observação: o registro de áudio contém 2,4 segundos sem origem identificada.`,
    'charles the wolf': `DIAGNÓSTICO — CHARLES THE WOLF
Estado nominal: operacional
Sincronização de voz: instável em testes seletivos
Observação: resposta registrada antes do envio de um comando em uma única sessão.`,
    'beth the spider': `DIAGNÓSTICO — BETH THE SPIDER
Estado nominal: restrição recomendada
Classificação de objetos: divergência documentada
Observação: o pacote de correção não possui assinatura digital válida.`,
    'croko the crocodile': `DIAGNÓSTICO — CROKO THE CROCODILE
Estado nominal: operacional com ressalvas
Repetição de áudio: acima do limite previsto
Observação: sensores internos registraram atividade durante uma janela marcada como vazia.`,
    'lindy': `DIAGNÓSTICO — LINDY
Estado nominal: operacional
Módulo de conversação: conteúdo fora do roteiro
Referências detectadas: flores, poemas, 1997
Observação: origem do texto não identificada.`,
    'junk': `DIAGNÓSTICO — JUNK / MINI JUNK
Estado nominal: inconclusivo
Movimentação após fechamento: relatos não confirmados
Observação: o inventário não coincide com a última contagem física.`
  };

  const incidents = {
    'rosie the fox': `INCIDENTES — ROSIE THE FOX
Registro incompleto: testes com comandos divergentes.
Conclusão oficial: variação ambiental.
Anexo técnico: indisponível.`,
    'charles the wolf': `INCIDENTES — CHARLES THE WOLF
Registro incompleto: resposta vocal fora do roteiro.
Conclusão oficial: falha de sincronização.
Anexo técnico: removido da cópia distribuída.`,
    'beth the spider': `INCIDENTES — BETH THE SPIDER
Registro: divergência entre classificação de visitante e objeto.
Conclusão oficial: revisão de software necessária.
Observação: a cópia pública não contém o relatório original.`,
    'croko the crocodile': `INCIDENTES — CROKO THE CROCODILE
Registro: funcionário encontrou uma criança na sala de Croko durante o fim de outubro de 1998.
Resumo da testemunha: a unidade interrompeu imediatamente a atividade quando o funcionário entrou.
Conclusão oficial: ocorrência em revisão. O anexo de câmera não está disponível.`,
    'lindy': `INCIDENTES — LINDY
Registro: unidade encontrada imóvel diante de uma parede, falando sobre flores.
Conclusão oficial: interação sem contexto identificável.
Anexo: não localizado.`,
    'junk': `INCIDENTES — JUNK / MINI JUNK
Registro: unidades encontradas em locais diferentes dos pontos de inventário após o fechamento.
Conclusão oficial: erro de contagem.
Anexo: ausente.`
  };
  
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function persist() {
    savedState = {
      discovered: [...discovered],
      unlockedApps: [...unlockedApps],
      trashChecked: !!savedState.trashChecked,
      accessLevel,
      fisherBugsFound,
      fisherPasswordKnown,
      promotedToLindy
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(savedState));
    } catch (e) {
      showToast('Não foi possível salvar localmente neste navegador.');
    }
  }

  function loadSave() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);

if (!raw) {
  for (const key of LEGACY_KEYS) {
    raw = localStorage.getItem(key);
    if (raw) break;
  }
}
      if (!raw) return;
      const data = JSON.parse(raw);
      (data.discovered || []).forEach(x => discovered.add(x));
      (data.unlockedApps || []).forEach(x => unlockedApps.add(x));
      savedState.trashChecked = !!data.trashChecked;
      accessLevel = data.accessLevel === 'LINDY' ? 'LINDY' : 'JUNK';
      fisherBugsFound = Math.max(0, Math.min(5, Number(data.fisherBugsFound) || 0));
      fisherPasswordKnown = !!data.fisherPasswordKnown || discovered.has('testimony_guard');
      promotedToLindy = !!data.promotedToLindy || accessLevel === 'LINDY';
    } catch (e) {
      showToast('O salvamento local não pôde ser lido.');
    }
  }

  function reveal(name) {
    if (!discovered.has(name)) {
      discovered.add(name);
      persist();
      updateFiles();
      showToast('Nova pista registrada: ' + name);
    }
  }

  function updateFiles() {
    $$('.hidden-file').forEach(el => {
      const key = el.dataset.reveal || el.dataset.doc;
      el.style.display = discovered.has(key) ? 'flex' : 'none';
    });

    const visible = $$('.file-item').filter(
      el => getComputedStyle(el).display !== 'none'
    ).length;

    $('#file-count').textContent = `${visible} objeto(s)`;

    const hint = $('.file-hint');
    if (hint && discovered.size) {
      hint.textContent =
        'Há registros adicionais no diretório. A lista foi atualizada.';
    }

    if (savedState.trashChecked) {
      $('#restore-note').textContent =
        'Verificação concluída. Um item órfão foi localizado no diretório.';
    }

    
    const archiveButton = $('#archived-mail-button');
    const archiveHint = $('#mail-archive-hint');

    if (archiveButton) {
      const archiveFound = discovered.has('archived_mail.txt');

      archiveButton.disabled = !archiveFound;
      archiveButton.textContent = archiveFound
        ? 'Abrir mensagem arquivada'
        : 'Mensagem arquivada · indisponível';

      if (archiveHint) {
        archiveHint.textContent = archiveFound
          ? 'Registro recuperado. Abra a mensagem para ler o conteúdo.'
          : 'Dica: procure uma função de recuperação no terminal.';
      }
    }

    updateAccessUI();
    renderTrash();
  }

  function updateAccessUI() {
    const rank = accessLevel === 'LINDY' ? 'LINDY' : 'JUNK';
    const terminalRank = $('#terminal-rank');
    if (terminalRank) terminalRank.textContent = rank;
    const startUser = $('.start-user strong');
    if (startUser) startUser.textContent = rank;
    const welcomeRank = $('#welcome-rank');
    if (welcomeRank) welcomeRank.textContent = rank;
    const filesRank = $('#files-rank');
    if (filesRank) filesRank.textContent = rank;
    const startSmall = $('.start-user small');
    if (startSmall) startSmall.textContent = accessLevel === 'LINDY' ? 'Funcionário autorizado' : 'Funcionário temporário';
    const welcomePill = $('.welcome-body .level-pill');
    if (welcomePill) {
      welcomePill.textContent = accessLevel === 'LINDY' ? 'NÍVEL DE ACESSO LINDY' : 'NÍVEL DE ACESSO 0';
      welcomePill.style.background = accessLevel === 'LINDY' ? '#dff1df' : '';
    }
    const startAccess = $('.start-links .tiny');
    if (startAccess) startAccess.textContent = 'Acesso: ' + rank;
    const path = $('.toolbar span');
    if (path) path.textContent = accessLevel === 'LINDY' ? '📍 C:\\ROSIE\\LINDY\\DOCUMENTS' : '📍 C:\\ROSIE\\JUNK\\DOCUMENTS';
    const fisherItem = $('#fisher-trash-item');
    if (fisherItem) fisherItem.hidden = false;
    const promotion = $('#promotion-mail');
    if (promotion) promotion.hidden = !promotedToLindy;
  }

  function activateWindow(id) {
    const win = $(`[data-window="${id}"]`);
    if (!win) return;

    win.classList.add('open');
    win.style.zIndex = ++zIndex;

    playSound('open');

    $$('.task-button').forEach(b =>
      b.classList.toggle('selected', b.dataset.task === id)
    );

    if (!$(`[data-task="${id}"]`)) {
      const task = document.createElement('button');
      task.className = 'task-button selected';
      task.dataset.task = id;

      task.textContent = ({
        welcome: 'Bem-vindo',
        files: 'Arquivos',
        mail: 'Correio',
        recycle: 'Lixeira',
        terminal: 'Terminal',
        reader: 'Bloco de Notas',
        vision: 'Rosie Vision'
      })[id] || id;

      task.addEventListener('click', () => {
        const target = $(`[data-window="${id}"]`);
        if (target && target.classList.contains('open')) {
          closeWindow(id);
        } else {
          activateWindow(id);
        }
      });

      taskButtons.appendChild(task);
    }

    if (id === 'terminal') {
      setTimeout(() => input.focus(), 80);
    }
  }

  function closeWindow(
