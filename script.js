
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
      boot: 'sounds/windows-xp-startup.mp3',
      open: 'sounds/open.wav',
      close: 'sounds/close.wav',
      terminal: 'sounds/terminal.wav',
      alert: 'sounds/fears-to-fathom-notification-sound.mp3',
      static: 'sounds/static-radio.mp3',
      rare: 'sounds/videoplayback.webm'
    };

    const fallback = {
      boot: [[440, 0.12], [660, 0.14], [880, 0.20]],
      open: [[660, 0.05], [880, 0.06]],
      close: [[620, 0.05], [420, 0.08]],
      terminal: [[720, 0.04]],
      alert: [[440, 0.13], [330, 0.18]],
      static: [[90, 0.08], [140, 0.05], [70, 0.12]],
      rare: [[220, 0.12], [165, 0.18], [110, 0.24]]
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
    audio.volume = name === 'static' ? 0.16 : 0.35;
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
    const desktopToggle = $('#desktop-audio-toggle');
    if (desktopToggle) {
      desktopToggle.textContent = enabled ? '♫' : '♪';
      desktopToggle.setAttribute('aria-pressed', String(enabled));
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
  let fisherPlaySeconds = 0;
  let fisherClock = null;
  let fisherAnomalyActive = false;
  let fisherPasswordKnown = false;
  let promotedToLindy = false;
  let cameraIndex = 0;
  let rareCameraEventPlayed = false;
  let lastCameraSignal = '';
  let rareEventTimer = null;
  const cameraNames = [
    'CAM 01 · ENTRADA / RECEPÇÃO',
    'CAM 02 · SALÃO DE FESTAS PRINCIPAL',
    'CAM 03 · PALCO',
    'CAM 04 · BALCÃO',
    'CAM 05 · CORREDOR LATERAL',
    'CAM 06 · ARCADES',
    'CAM 07 · PLAYGROUND',
    'CAM 08 · SALA DO CROCO — ENTRADA',
    'CAM 09 · SALA DO CROCO — INTERIOR',
    'CAM 10 · ÁREA RESTRITA: CORREDORES',
    'CAM 11 · COZINHA',
    'CAM 12 · ÁREA RESTRITA: ESCRITÓRIO DO NATHAN',
    'CAM 13 · ÁREA RESTRITA: SEGURANÇA'
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
    if (/nova mensagem|promoção|notificação|e-mail recebido/i.test(message)) playSound('alert');
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
      fisherPlaySeconds,
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
      fisherPlaySeconds = Math.max(0, Number(data.fisherPlaySeconds) || 0);
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

  function closeWindow(id) {
    const win = $(`[data-window="${id}"]`);
    if (win) win.classList.remove('open', 'active-window');

    playSound('close');

    const task = $(`[data-task="${id}"]`);
    if (task) task.remove();
  }

  function openDoc(name) {
    if (!docs[name]) {
      showToast('Arquivo não encontrado.');
      return;
    }

    const unlockRequirements = {
      'maintenance.log': 'maintenance.log',
      'incident_04.txt': 'incident_04.txt',
      'archived_mail.txt': 'archived_mail.txt',
      'mechanic_statement_07.txt': 'mechanic_statement_07.txt',
      'animatronics_logs.txt': 'animatronics_logs.txt',
      'rosie_vision.pkg': 'rosie_vision.pkg'
    };

    if (
      unlockRequirements[name] &&
      !discovered.has(unlockRequirements[name])
    ) {
      showToast('O arquivo ainda não foi descoberto.');
      return;
    }

    const visibleName = name === 'archived_mail.txt' ? 'mail.txt' : name === 'incident_04.txt' ? 'incidente.txt' : name;
    $('#reader-title').textContent =
      visibleName + ' — Bloco de Notas';

    $('#reader-content').textContent = docs[name];
    activateWindow('reader');

    if ([
      'maintenance.log',
      'incident_04.txt',
      'archived_mail.txt',
      'mechanic_statement_07.txt',
      'animatronics_logs.txt',
      'rosie_vision.pkg'
    ].includes(name)) {
      reveal(name);
    }
  }

  function addLine(text, cls = '') {
    const p = document.createElement('p');
    if (cls) p.className = cls;

    p.textContent = text;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }

  function printHelp() {
    addLine('Comandos disponíveis:');
addLine(
  'help | whoami | date | status | files | read <arquivo> | open <programa> | clear'
);
addLine('backup export | backup import <código>');
addLine('restore archive');
if (accessLevel === 'LINDY') {
      addLine('Animatronics Logs | Animatronics [Nome] | Animatronics Diagnostics | Animatronics Incidents');
      addLine('Animatronics Diagnostics [Nome] | Animatronics Incidents [Nome]');
      addLine('Rosie Vision | Camera Status | Camera Next | Camera Previous');
    } else {
      addLine('Depoimento | Depoimento guarda | Depoimento manutencao | Depoimento cozinha');
      addLine('Acesso JUNK: consultas de animatrônicos e Rosie Vision bloqueadas.');
    }
  }

  function exportBackup() {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      format: 'RosieOSSave',
      version: '2.4.0',
      discovered: [...discovered],
      unlockedApps: [...unlockedApps],
      trashChecked: !!savedState.trashChecked,
      accessLevel, fisherBugsFound, fisherPlaySeconds, fisherPasswordKnown, promotedToLindy
    }))));

    addLine('CÓDIGO DE BACKUP (guarde em local seguro):');
    addLine(payload);
    addLine('Para restaurar, use: backup import <código>');
  }

  function importBackup(code) {
    try {
      const parsed = JSON.parse(
        decodeURIComponent(escape(atob(code)))
      );

      if (
        parsed.format !== 'RosieOSSave' ||
        !Array.isArray(parsed.discovered)
      ) {
        throw new Error('Formato');
      }

      discovered.clear();
      parsed.discovered.forEach(x => discovered.add(x));

      unlockedApps.clear();
      (parsed.unlockedApps || []).forEach(x => unlockedApps.add(x));

      savedState.trashChecked = !!parsed.trashChecked;
      accessLevel = parsed.accessLevel === 'LINDY' ? 'LINDY' : 'JUNK';
      fisherBugsFound = Math.max(0, Math.min(5, Number(parsed.fisherBugsFound) || 0));
      fisherPlaySeconds = Math.max(0, Number(parsed.fisherPlaySeconds) || 0);
      fisherPasswordKnown = !!parsed.fisherPasswordKnown || discovered.has('testimony_guard');
      promotedToLindy = !!parsed.promotedToLindy || accessLevel === 'LINDY';

      persist();
      updateFiles();
      addLine('Backup importado. Descobertas restauradas.');
    } catch (e) {
      addLine('Backup inválido ou incompleto.', 'terminal-warning');
    }
  }

  function runAnimatronics(command) {
    const trimmed = command.trim();
    if (accessLevel !== 'LINDY' && /^animatronics\b/i.test(trimmed)) {
      addLine('ACESSO NEGADO: este comando exige o nível LINDY.', 'terminal-warning');
      return true;
    }
    const low = trimmed.toLowerCase();

    if (low === 'animatronics logs') {
      addLine('CATÁLOGO ANIMATRONICS — UNIDADE DA PENSILVÂNIA');
      addLine(
        'Rosie The Fox | Charles The Wolf | Beth The Spider | Croko The Crocodile | Lindy | Junk'
      );
      addLine(
        'Dica: use Animatronics [Nome] para consultar uma ficha individual.'
      );
      return true;
    }

    if (
      low === 'animatronics diagnostics' ||
      low === 'animatronics incidents'
    ) {
      const type = low.endsWith('diagnostics')
        ? 'diagnostics'
        : 'incidents';

      const database = type === 'diagnostics'
        ? diagnostics
        : incidents;

      addLine(
        type === 'diagnostics'
          ? 'RELATÓRIOS TÉCNICOS — ÍNDICE PARCIAL'
          : 'INCIDENTES — ÍNDICE PARCIAL'
      );

      Object.keys(database).forEach(name =>
        addLine(name.toUpperCase() + ' — ' + database[name].split('\n')[1])
      );

      addLine(
        'Use Animatronics ' +
        (type === 'diagnostics' ? 'Diagnostics' : 'Incidents') +
        ' [Nome] para abrir um registro individual.'
      );

      return true;
    }

    const match = trimmed.match(
      /^animatronics\s+(diagnostics|incidents)\s+(.+)$/i
    );

    if (match) {
      const type = match[1].toLowerCase();
      const name = match[2].toLowerCase();

      const database = type === 'diagnostics'
        ? diagnostics
        : incidents;

      const entry = database[name];

      if (!entry) {
        addLine('Registro individual não encontrado.');
      } else {
        entry.split('\n').forEach(line => addLine(line));
      }

      return true;
    }

    const profile = trimmed.match(/^animatronics\s+(.+)$/i);

    if (
      profile &&
      !['logs', 'diagnostics', 'incidents'].includes(
        profile[1].toLowerCase()
      )
    ) {
      const name = profile[1].toLowerCase();

      if (!animatronics[name]) {
        addLine('Ficha não localizada no índice JUNK.');
      } else {
        animatronics[name].description
          .split('\n')
          .forEach(line => addLine(line));
      }

      return true;
    }

    return false;
  }

  function runCommand(raw) {
    const cmd = raw.trim().replace(/^>\s*/, '');
    if (!cmd) return;

    addLine('> ' + cmd);

    playSound('terminal');

    const low = cmd.toLowerCase();

    if (/^depoimento(?:\s+.*)?$/i.test(cmd)) {
      runTestimony(cmd);
      return;
    }

    if (/^(rosie\s+vision|camera\s+(status|next|previous)|vision)$/i.test(cmd)) {
      if (accessLevel !== 'LINDY') {
        addLine('ACESSO NEGADO: Rosie Vision exige o nível LINDY.', 'terminal-warning');
        return;
      }
      const action = low.replace(/^rosie\s+vision$/, 'open').replace(/^vision$/, 'open');
      if (action === 'open') { activateWindow('vision'); updateCameraView(); addLine('Rosie Vision iniciado.'); }
      else if (action === 'camera status') { updateCameraView(); addLine(cameraNames[cameraIndex] + ' | ' + $('#camera-state').textContent); }
      else { cameraIndex = (cameraIndex + (action.endsWith('next') ? 1 : -1) + cameraNames.length) % cameraNames.length; updateCameraView(); addLine('Câmera selecionada: ' + cameraNames[cameraIndex]); }
      return;
    }

    if (runAnimatronics(cmd)) {
      if (low === 'animatronics logs') {
        reveal('animatronics_logs.txt');
      }

      if (
        low === 'animatronics diagnostics' ||
        low === 'animatronics incidents'
      ) {
        showToast(
          'Índice consultado. Algumas fichas continuam incompletas.'
        );
      }

      return;
    }

    if (low.startsWith('backup export')) {
      exportBackup();
      return;
    }

    if (low.startsWith('backup import ')) {
      importBackup(cmd.slice('backup import '.length).trim());
      return;
    }

    const parts = cmd.split(/\s+/);
    const base = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (base) {
      case 'help':
        printHelp();
        break;

      case 'whoami':
        addLine(accessLevel);
        addLine(accessLevel === 'LINDY' ? 'Nível de autorização: LINDY (autorizado)' : 'Nível de autorização: 0 (temporário)');
        break;

      case 'date':
        addLine(new Date().toLocaleString('pt-BR'));
        break;

      case 'status':
        addLine('ROSIE OS 2.4.0 | SISTEMA: OPERACIONAL | REDE: LOCAL | ACESSO: ' + accessLevel);
        addLine(
          `AVISOS: ${discovered.size} pista(s) descoberta(s), 1 item arquivado.`
        );
        break;

      case 'files':
      case 'dir':
      case 'ls': {
        addLine('C:\\ROSIE\\JUNK\\DOCUMENTS');

        const publicFiles = [
          'welcome.txt',
          'cafe_rules.txt',
          'company_info.txt',
          'staff_memo.txt'
        ];

        const visibleFiles = [
          ...publicFiles,
          ...[...discovered].filter(
            name => docs[name] && !publicFiles.includes(name)
          )
        ];

        addLine(visibleFiles.join('  '));
        addLine(
          'Dica: use read <nome_do_arquivo> para abrir um documento descoberto.'
        );
        break;
        }
    
      case 'read':
        if (!arg) {
          addLine('Uso: read <nome_do_arquivo>');
          break;
        }
        openDoc(arg);
        break;

      case 'clear':
      case 'cls':
        output.innerHTML = '';
        break;

      case 'open':
        if (
          arg.toLowerCase() === 'mail' ||
          arg.toLowerCase() === 'correio'
        ) {
          activateWindow('mail');
          addLine('Correio interno aberto. 1 mensagem nova.');
        } else if (arg.toLowerCase() === 'vision') {
          if (accessLevel !== 'LINDY') {
            addLine('Acesso negado. Rosie Vision exige o nível LINDY.', 'terminal-warning');
          } else if (!unlockedApps.has('rosie-vision')) {
            addLine('Acesso negado. Aplicativo não autorizado.', 'terminal-warning');
            addLine('Um pacote de autorização pode estar disponível.');
          } else {
            activateWindow('vision');
            updateCameraView();
            reveal('rosie_vision.pkg');
          }
        } else if (arg.toLowerCase() === 'trash') {
          activateWindow('recycle');
        } else if (arg.toLowerCase() === 'files') {
          activateWindow('files');
        } else if (arg.toLowerCase() === 'terminal') {
          activateWindow('terminal');
        } else {
          addLine('Aplicativo não encontrado.');
        }
        break;

      case 'restore':
        if (arg.toLowerCase() === 'archive') {
          reveal('archived_mail.txt');
          addLine('Um item arquivado foi localizado.');
        } else {
          addLine('Uso: restore archive');
        }
        break;

      case 'unlock':
        if (accessLevel !== 'LINDY') {
          addLine('ACESSO NEGADO: autorização insuficiente.', 'terminal-warning');
        } else if (arg.toLowerCase() === 'rv-03-14') {
          unlockedApps.add('rosie-vision');
          reveal('rosie_vision.pkg');
          persist();
          addLine('Pacote Rosie Vision registrado no menu local.');
          addLine('Dica: use open vision para iniciar o programa.');
        } else {
          addLine('Formato inválido.', 'terminal-warning');
        }
        break;

      case 'system32':
      case 'rosie_core':
      case 'override':
        addLine('ACESSO NEGADO: credenciais insuficientes.', 'terminal-warning');
        addLine('Esta tentativa foi registrada.');
        reveal('maintenance.log');
        break;

      case 'lily':
      case 'flower':
      case 'lirio':
      case 'liriovermelho':
        addLine('Nenhum resultado indexado para essa consulta.');
        addLine('O catálogo registra uma palavra semelhante em um documento indisponível.');
        break;

      default:
        addLine(`'${cmd}' não é reconhecido como comando interno ou externo.`);
        addLine('Digite >help para consultar os comandos disponíveis.');
    }
  }


  function runTestimony(command) {
    const arg = command.trim().replace(/^depoimento\s*/i, '').trim().toLowerCase();
    if (!arg) {
      addLine('DEPOIMENTOS DISPONÍVEIS:');
      addLine('Depoimento guarda | Depoimento manutencao | Depoimento cozinha');
      addLine('Selecione um depoimento para abrir a transcrição.');
      return;
    }
    const aliases = { '1': 'guarda', 'guarda': 'guarda', 'guarda noturna': 'guarda', '2': 'manutencao', 'manutenção': 'manutencao', 'manutencao': 'manutencao', '3': 'cozinha', 'funcionario da cozinha': 'cozinha', 'funcionário da cozinha': 'cozinha', 'cozinha': 'cozinha' };
    const key = aliases[arg];
    if (!key || !testimonies[key]) {
      addLine('Depoimento não localizado. Use: Depoimento para consultar o índice.');
      return;
    }
    addLine(testimonies[key].title);
    testimonies[key].text.split('\n').forEach(line => addLine(line));
    if (key === 'guarda') {
      fisherPasswordKnown = true;
      discovered.add('testimony_guard');
      persist();
      addLine('Nota do sistema: referência de acesso do Fisher registrada na sessão.');
    } else if (key === 'manutencao') {
      reveal('mechanic_statement_07.txt');
      addLine('Anexo relacionado localizado no diretório de documentos.');
    }
  }

  function updateCameraView() {
    const name = $('#camera-name');
    const state = $('#camera-state');
    const timestamp = $('#camera-timestamp');
    const index = $('#camera-index');
    const statusbar = $('#camera-statusbar');
    if (name) name.textContent = cameraNames[cameraIndex];
    const states = ['SINAL INTERMITENTE', 'SEM SINAL', 'SINAL ESTÁVEL', 'SINAL INTERMITENTE'];
    const nextSignal = states[(cameraIndex * 3 + Math.floor(Date.now() / 7000)) % states.length];
    if (state) state.textContent = nextSignal;
    if (nextSignal !== lastCameraSignal && (nextSignal === 'SEM SINAL' || nextSignal === 'SINAL INTERMITENTE')) playSound('static');
    lastCameraSignal = nextSignal;
    if (timestamp) timestamp.textContent = 'REC: ' + new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    if (index) index.textContent = String(cameraIndex + 1).padStart(2, '0') + ' / ' + cameraNames.length;
    if (statusbar) statusbar.textContent = cameraNames.length + ' câmeras registradas · ' + (state ? state.textContent.toLowerCase() : 'sinal indisponível');
    if (cameraIndex === 2 && !rareCameraEventPlayed && soundEnabled) {
      if (rareEventTimer) clearTimeout(rareEventTimer);
      rareEventTimer = setTimeout(() => {
        if (cameraIndex !== 2 || !$('#vision')?.classList.contains('open') || rareCameraEventPlayed) return;
        rareCameraEventPlayed = true;
        playSound('rare');
        showToast('SINAL ANÔMALO DETECTADO · CAM 03');
        const viewer = $('.camera-square');
        if (viewer) {
          viewer.classList.add('camera-rare-event');
          setTimeout(() => viewer.classList.remove('camera-rare-event'), 2600);
        }
      }, 18000 + Math.floor(Math.random() * 42000));
    } else if (cameraIndex !== 2 && rareEventTimer) {
      clearTimeout(rareEventTimer);
      rareEventTimer = null;
    }
  }

  function closeAllWindows() {
    $$('.window').forEach(win => win.classList.remove('open', 'active-window'));
    if (taskButtons) taskButtons.replaceChildren();
  }

  function deliverPromotion() {
    if (promotedToLindy) return;
    promotedToLindy = true;
    accessLevel = 'LINDY';
    unlockedApps.add('rosie-vision');
    const promotion = $('#promotion-mail');
    if (promotion) promotion.hidden = false;
    const shutdown = $('#shutdown-screen');
    const heading = shutdown ? $('h2', shutdown) : null;
    const message = shutdown ? $('p', shutdown) : null;
    if (heading) heading.textContent = 'Atualização de acesso concluída';
    if (message) message.textContent = 'A sessão foi encerrada. Uma nova mensagem aguarda no Correio Interno.';
    closeAllWindows();
    updateAccessUI();
    persist();
    if (shutdown) shutdown.hidden = false;
    showToast('Nova mensagem recebida: promoção para LINDY.');
  }

  function stopFisherClock() {
    if (fisherClock) clearInterval(fisherClock);
    fisherClock = null;
  }

  function crashFisher() {
    stopFisherClock();
    fisherAnomalyActive = false;
    const win = $('#fisher');
    if (win) win.classList.remove('open', 'active-window');
    const task = $('[data-task="fisher"]');
    if (task) task.remove();
    const status = $('#fisher-status');
    if (status) status.textContent = 'Aplicativo encerrado inesperadamente';
    persist();
    playSound('close');
    if (fisherBugsFound >= 5) setTimeout(deliverPromotion, 450);
  }

  function makeFish(kind = 'fish') {
    const board = $('#fisher-board');
    if (!board || !board.classList.contains('active')) return;
    const fish = document.createElement('button');
    fish.type = 'button';
    fish.className = 'fisher-target';
    fish.dataset.kind = kind;
    fish.textContent = kind === 'anomaly'
      ? ['🐟', '🐠', '🦈', '🐡'][Math.floor(Math.random() * 4)]
      : ['🐟', '🐠', '🐡', '🐟'][Math.floor(Math.random() * 4)];
    fish.setAttribute('aria-label', 'Peixe');
    fish.style.top = (8 + Math.random() * 76) + '%';
    fish.style.setProperty('--fish-duration', (5 + Math.random() * 7) + 's');
    fish.style.setProperty('--fish-delay', (Math.random() * -7) + 's');
    if (kind === 'anomaly') {
      fish.classList.add('fisher-anomaly');
      fish.setAttribute('aria-label', 'Peixe');
    }
    if (kind === 'bomb') fish.dataset.kind = 'bomb';
    fish.addEventListener('click', () => {
      if (kind === 'bomb') {
        fish.textContent = '💣';
        crashFisher();
        return;
      }
      if (kind === 'anomaly') {
        fisherBugsFound = Math.min(5, fisherBugsFound + 1);
        fisherAnomalyActive = false;
        playSound('alert');
        const count = $('#fisher-bug-count');
        const score = $('#fisher-score');
        if (count) count.textContent = fisherBugsFound + '/5';
        if (score) score.textContent = String(fisherBugsFound * 100).padStart(3, '0');
        fish.remove();
        persist();
        crashFisher();
        return;
      }
      fish.remove();
      const score = $('#fisher-score');
      if (score) score.textContent = String((Number(score.textContent) || 0) + 10).padStart(3, '0');
      if (Math.random() < 0.14) makeFish('bomb');
      else if (Math.random() < 0.7) makeFish('fish');
    });
    board.appendChild(fish);
  }

  function spawnFisherAnomaly() {
    if (fisherAnomalyActive || fisherBugsFound >= 5) return;
    fisherAnomalyActive = true;
    makeFish('anomaly');
  }

  function buildFisherBoard() {
    const board = $('#fisher-board');
    if (!board) return;
    stopFisherClock();
    board.replaceChildren();
    board.classList.add('active');
    fisherAnomalyActive = false;
    for (let i = 0; i < 8; i++) makeFish(Math.random() < 0.12 ? 'bomb' : 'fish');
    const score = $('#fisher-score');
    const count = $('#fisher-bug-count');
    const message = $('#fisher-message');
    if (score) score.textContent = String(fisherBugsFound * 100).padStart(3, '0');
    if (count) count.textContent = fisherBugsFound + '/5';
    if (message) message.textContent = 'Conexão estabelecida.';

    fisherClock = setInterval(() => {
      const win = $('#fisher');
      const game = $('#fisher-game');
      if (!win || !win.classList.contains('open') || !game || game.hidden) {
        stopFisherClock();
        return;
      }
      fisherPlaySeconds++;
      if (fisherPlaySeconds % 10 === 0) persist();
      const threshold = 120 + fisherBugsFound * 45;
      if (fisherPlaySeconds >= threshold && !fisherAnomalyActive && fisherBugsFound < 5) {
        spawnFisherAnomaly();
      }
    }, 1000);
  }

  function openFisher() {
    activateWindow('fisher');
    const lock = $('#fisher-lock');
    const game = $('#fisher-game');
    if (lock) lock.hidden = false;
    if (game) game.hidden = true;
    const board = $('#fisher-board');
    if (board) board.classList.remove('active');
    stopFisherClock();
    const pass = $('#fisher-password');
    if (pass) pass.value = '';
    const error = $('#fisher-password-error');
    if (error) error.textContent = '';
  }

  function renderTrash() {
    const container = $('#trash-items');
    if (!container) return;

    container.innerHTML = '';
    const fisherItem = $('#fisher-trash-item');
    if (fisherItem) fisherItem.hidden = false;

    [
      'archived_mail.txt',
      'mechanic_statement_07.txt',
      'incident_04.txt'
    ].filter(name => discovered.has(name)).forEach(name => {
      const btn = document.createElement('button');
      const label = name === 'archived_mail.txt' ? 'mail.txt' : name === 'incident_04.txt' ? 'incidente.txt' : name;
      btn.textContent = '📄 ' + label;
      btn.addEventListener('click', () => openDoc(name));
      container.appendChild(btn);
    });

    if (!container.children.length && savedState.trashChecked) {
      const note = document.createElement('p');
      note.className = 'tiny muted';
      note.textContent = 'Nenhum outro item recuperável foi indexado.';
      container.appendChild(note);
    }
  }

  function ensureReaderTask() {
    if ($('[data-task="reader"]')) return;

    const task = document.createElement('button');
    task.className = 'task-button selected';
    task.dataset.task = 'reader';
    task.textContent = 'Bloco de Notas';

    task.addEventListener('click', () => {
      activateWindow('reader');
    });

    taskButtons.appendChild(task);
  }

  // Inicialização do sistema
  loadSave();
  updateFiles();
  updateCameraView();

  
  function startBootSequence() {
    const screen = $('#boot-screen');
    const log = $('#boot-log');
    const progress = $('#boot-progress');
    const status = $('#boot-status');
    const soundButton = $('#boot-sound');

    if (!screen || !log || !progress || !status) {
      console.error('Rosie OS: elementos da tela de boot não encontrados.');
      return;
    }

    if (soundButton) {
      soundButton.textContent = soundEnabled ? '♫ Som: ligado' : '♫ Som: desligado';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));

      soundButton.addEventListener('click', () => {
        setSoundEnabled(!soundEnabled);
      });
    }

    const lines = [
      { text: 'ROSIE BIOS v2.2.0', progress: 5 },
      { text: 'Verificando memória do sistema ........ OK', progress: 16 },
      { text: 'Carregando módulos corporativos ...... OK', progress: 29 },
      { text: 'Montando unidade C:\\ROSIE ............ OK', progress: 42 },
      { text: 'Verificando diretório JUNK ........... OK', progress: 56 },
      { text: 'Restaurando preferências locais ...... OK', progress: 70 },
      { text: 'Sincronizando catálogo de arquivos ... OK', progress: 82 },
      { text: 'Inicializando interface gráfica ..... OK', progress: 94 },
      { text: 'Bem-vindo à família Rosie.', progress: 100 }
    ];

    let index = 0;

    screen.hidden = false;
    screen.classList.remove('boot-finished');
    log.replaceChildren();
    progress.style.width = '0%';
    status.textContent = 'POST em execução...';

    function finishBoot() {
      status.textContent = 'Área de trabalho pronta.';
      progress.style.width = '100%';

      setTimeout(() => {
        screen.classList.add('boot-finished');

        setTimeout(() => {
          screen.hidden = true;
        }, 700);
      }, 550);
    }

    function nextLine() {
      if (index >= lines.length) {
        finishBoot();
        return;
      }

      const line = lines[index];
      const p = document.createElement('p');
      p.textContent = '> ' + line.text;

      if (line.text.includes('JUNK')) {
        p.className = 'boot-warning';
      }

      log.appendChild(p);
      progress.style.width = line.progress + '%';
      status.textContent = 'Inicializando... ' + line.progress + '%';

      if (soundEnabled) {
        playTone(520 + (index % 3) * 100, 0.035, 'square', 0.018);
      }

      index++;
      setTimeout(nextLine, 380);
    }

    setTimeout(() => {
      playSound('boot');
      nextLine();
    }, 350);
  }

  $$('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.open;
      if (startMenu) startMenu.hidden = true;
      activateWindow(id);
    });
  });

  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeWindow(btn.dataset.close);
    });
  });

  $$('[data-minimize]').forEach(btn => {
    btn.addEventListener('click', () => {
      const win = $(`[data-window="${btn.dataset.minimize}"]`);
      if (win) win.classList.remove('open');
    });
  });

  $$('[data-doc]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (startMenu) startMenu.hidden = true;
      openDoc(btn.dataset.doc);

      const reader = $('[data-window="reader"]');
      if (reader && reader.classList.contains('open')) {
        ensureReaderTask();
      }
    });
  });

  const desktopAudioToggle = $('#desktop-audio-toggle');
  if (desktopAudioToggle) {
    desktopAudioToggle.setAttribute('aria-pressed', String(soundEnabled));
    desktopAudioToggle.textContent = soundEnabled ? '♫' : '♪';
    desktopAudioToggle.addEventListener('click', () => {
      setSoundEnabled(!soundEnabled);
      desktopAudioToggle.setAttribute('aria-pressed', String(soundEnabled));
      desktopAudioToggle.textContent = soundEnabled ? '♫' : '♪';
    });
  }

  const startButton = $('#start-button');

  if (startButton && startMenu) {
    startButton.addEventListener('click', () => {
      startMenu.hidden = !startMenu.hidden;
    });

    document.addEventListener('click', e => {
      if (
        !startMenu.hidden &&
        !startMenu.contains(e.target) &&
        !startButton.contains(e.target)
      ) {
        startMenu.hidden = true;
      }
    });
  }

  const terminalForm = $('#terminal-form');

  if (terminalForm) {
    terminalForm.addEventListener('submit', e => {
      e.preventDefault();
      if (input) {
        runCommand(input.value);
        input.value = '';
      }
    });
  }


  const fisherTrashItem = $('#fisher-trash-item');
  if (fisherTrashItem) fisherTrashItem.addEventListener('click', openFisher);

  const fisherPasswordForm = $('#fisher-password-form');
  if (fisherPasswordForm) fisherPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    const pass = $('#fisher-password');
    const error = $('#fisher-password-error');
    if (!fisherPasswordKnown && !discovered.has('testimony_guard')) {
      if (error) error.textContent = 'Senha não aceita. Consulte os depoimentos de turno.';
      return;
    }
    if (!pass || pass.value !== 'Bubbli') {
      if (error) error.textContent = 'Senha incorreta.';
      return;
    }
    if (error) error.textContent = '';
    const lock = $('#fisher-lock');
    const game = $('#fisher-game');
    if (lock) lock.hidden = true;
    if (game) game.hidden = false;
    buildFisherBoard();
    const status = $('#fisher-status');
    if (status) status.textContent = 'Sessão autenticada';
  });

  const cameraPrev = $('#camera-prev');
  const cameraNext = $('#camera-next');
  if (cameraPrev) cameraPrev.addEventListener('click', () => {
    if (accessLevel !== 'LINDY') { showToast('Rosie Vision exige o nível LINDY.'); return; }
    cameraIndex = (cameraIndex - 1 + cameraNames.length) % cameraNames.length;
    updateCameraView();
  });
  if (cameraNext) cameraNext.addEventListener('click', () => {
    if (accessLevel !== 'LINDY') { showToast('Rosie Vision exige o nível LINDY.'); return; }
    cameraIndex = (cameraIndex + 1) % cameraNames.length;
    updateCameraView();
  });

  const restoreButton = $('#restore-button');

  if (restoreButton) {
    restoreButton.addEventListener('click', () => {
      savedState.trashChecked = true;

      updateFiles();
      persist();

      const note = $('#restore-note');

      if (note) {
        note.textContent =
          'Verificação concluída. Nenhum arquivo oculto foi recuperado automaticamente.';
      }

      showToast('Verificação concluída. Os arquivos protegidos permanecem ocultos.');
    });
  }

  const logoffButton = $('#logoff-button');

  if (logoffButton) {
    logoffButton.addEventListener('click', () => {
      if (startMenu) startMenu.hidden = true;

      const screen = $('#shutdown-screen');
      if (screen) screen.hidden = false;
    });
  }

  const loginAgain = $('#login-again');

  if (loginAgain) {
    loginAgain.addEventListener('click', () => {
      const screen = $('#shutdown-screen');
      if (screen) screen.hidden = true;

      activateWindow('welcome');
      updateAccessUI();
      showToast('Sessão iniciada: ' + accessLevel);
      if (promotedToLindy) activateWindow('mail');
    });
  }

  function updateClock() {
    const clock = $('#clock');

    if (clock) {
      clock.textContent = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  updateClock();
  setInterval(updateClock, 15000);

  // Arrastar janelas em telas maiores
  windows.forEach(win => {
    const bar = $('.titlebar', win);
    if (!bar) return;

    let startX = 0;
    let startY = 0;
    let left = 0;
    let top = 0;
    let dragging = false;

    bar.addEventListener('pointerdown', e => {
      if (
        e.target.closest('button') ||
        window.matchMedia('(max-width:650px)').matches
      ) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      left = win.offsetLeft;
      top = win.offsetTop;

      win.style.zIndex = ++zIndex;

      if (bar.setPointerCapture) {
        bar.setPointerCapture(e.pointerId);
      }
    });

    bar.addEventListener('pointermove', e => {
      if (!dragging) return;

      win.style.left =
        Math.max(
          0,
          Math.min(
            window.innerWidth - win.offsetWidth,
            left + e.clientX - startX
          )
        ) + 'px';

      win.style.top =
        Math.max(
          0,
          Math.min(
            window.innerHeight - win.offsetHeight - 40,
            top + e.clientY - startY
          )
        ) + 'px';
    });

    const stopDragging = () => {
      dragging = false;
    };

    bar.addEventListener('pointerup', stopDragging);
    bar.addEventListener('pointercancel', stopDragging);
  });

  // Fim da inicialização
  startBootSequence();
})();
