(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const windows = $$('.window');
  const startMenu = $('#start-menu');
  const output = $('#terminal-output');
  const input = $('#terminal-input');
  const toast = $('#toast');
  const taskButtons = $('#task-buttons');
  const SAVE_KEY = 'rosieOS22.save';
  const LEGACY_KEY = 'rosieOS21.save';
  let zIndex = 5;
  let toastTimer;
  const discovered = new Set();
  const unlockedApps = new Set();
  let savedState = { discovered: [], unlockedApps: [], trashChecked: false };

  const docs = {
    'welcome.txt': `ROSIE CAFÉ CORPORATION\n\nSeja bem-vindo à família Rosie!\n\nNossa missão é tornar cada pausa mais doce. A qualidade começa nos pequenos detalhes: um sorriso, uma mesa limpa e um relatório preenchido corretamente.\n\nLembrete: sua conta atual possui acesso JUNK. Consulte seu supervisor para solicitar permissões adicionais.\n\nTenha um excelente turno!`,
    'cafe_rules.txt': `ROSIE CAFÉ — REGRAS DA CASA\nVersão pública 2.2\n\n1. Trate todos os clientes com gentileza.\n2. Registre perdas e ocorrências no fim do turno.\n3. Não entre em áreas sinalizadas como RESTRITO.\n4. Não desligue equipamentos sem autorização.\n5. Se ouvir o telefone tocar em uma sala vazia, informe a supervisão.\n\nA regra 5 foi incluída por solicitação do departamento de operações.\nNão é necessário perguntar o motivo.`,
    'company_info.txt': `ROSIE CAFÉ CORPORATION\n\nFundação: registro interno indisponível\nDireção: Nathan [sobrenome omitido]\nCoordenação de projetos: Christopher\nDepartamento: Operações e Experiência\n\nA Rosie Café cresceu graças à dedicação de pessoas que acreditam em um ambiente acolhedor. Nossos parques, cafés e espaços de entretenimento devem ser seguros, alegres e memoráveis.\n\nNota administrativa: documentos de manutenção não fazem parte do pacote JUNK.`,
    'staff_memo.txt': `MEMORANDO INTERNO\nPara: equipe de apoio\nDe: Christopher\n\nPor favor, mantenham as cópias dos relatórios em ordem cronológica. Nathan quer que a inauguração seja impecável.\n\nUma observação: o arquivo de inventário voltou a aparecer depois de ter sido removido. A equipe de TI diz que é um erro de sincronização. Não percam tempo com isso.\n\n— Christopher`,
    'maintenance.log': `[LOG DE MANUTENÇÃO — CÓPIA PARCIAL]\n\n03:14:08 | Unidade C-04 reiniciada sem solicitação.\n03:14:11 | Áudio detectado em corredor vazio.\n03:14:12 | Operador: "Quem está aí?"\n03:14:14 | Áudio detectado novamente.\n03:14:15 | Operador encerrou a sessão.\n03:14:16 | SISTEMA: não havia operador conectado.\n\n[REGISTRO INTERROMPIDO]\n\nNota: este documento não deveria estar visível para o nível JUNK.`,
    'incident_04.txt': `INCIDENTE 04 — ACESSO RESTRITO\n\nO relatório oficial descreve o evento como uma falha elétrica de curta duração.\n\nA cópia de segurança contém uma linha adicional:\n"Ela sabia o nome do funcionário antes que ele se apresentasse."\n\nA linha foi removida da versão enviada à diretoria.\n\nSe este arquivo apareceu na sua pasta, não o mova para a rede compartilhada.\n\nFIM DO DOCUMENTO`,
    'archived_mail.txt': `MENSAGEM ARQUIVADA\nRemetente: [REMOVIDO]\nData: 17/10 — horário não sincronizado\nAssunto: O diretório que não existe\n\nChristopher,\n\nA pasta voltou. Eu apaguei três vezes, e ela continua surgindo depois das 03:14. Desta vez havia um arquivo com meu nome. Não abri.\n\nPor favor, não diga que é outro problema de sincronização.\n\n— N.`,
    'mechanic_statement_07.txt': `DECLARAÇÃO TÉCNICA 07\nAutora: Evelyn Hart, manutenção\nEstado: cópia recuperada parcialmente\n\nTerminei a preparação de Beth e Croko e registrei os resultados no catálogo Animatronics. Os quatro tipos de consulta continuam disponíveis no sistema antigo, embora não apareçam no menu padrão.\n\nAnimatronics Logs — lista de unidades registradas.\nAnimatronics [Nome] — ficha individual.\nAnimatronics Diagnostics — relatórios técnicos.\nAnimatronics Incidents — ocorrências e anexos.\n\nNão consegui explicar por que alguns registros foram alterados depois de assinados. Se esta cópia reapareceu, mantenham-na fora da pasta compartilhada.\n\nE. Hart`,
    'animatronics_logs.txt': `CATÁLOGO DE ANIMATRÔNICOS\nUnidade: Pensilvânia\nEstado: índice parcial\n\nRegistros recuperados: Rosie The Fox; Charles The Wolf; Beth The Spider; Croko The Crocodile; Lindy; Junk.\n\nAlgumas fichas exigem uma consulta individual. Os registros de incidentes não estão anexados a este índice.\n\n[FIM DO EXTRATO]`,
    'rosie_vision.pkg': `ROSIE VISION 0.7B\nPacote recuperado pelo sistema.\n\nO manifesto está incompleto. A aplicação de monitoramento foi instalada, mas nenhuma câmera respondeu ao teste de conexão.\n\nNota do operador: "A câmera do corredor estava desligada. Eu vi a imagem mesmo assim."\n\n[MANIFESTO ENCERRADO]`
  };

  const animatronics = {
    'rosie the fox': {
      title: 'ROSIE THE FOX',
      description: `Apresentadora principal e responsável pelas demonstrações de confeitaria. Projetada para interagir com visitantes e conduzir atividades no palco.\n\nNOTA DA EQUIPE: alguns comandos parecem não produzir resposta durante testes com adultos. O mesmo comando funcionou em uma festa infantil. A diferença ainda não foi explicada.`
    },
    'charles the wolf': {
      title: 'CHARLES THE WOLF',
      description: `Vocalista e coapresentador. Irmão de Rosie no desenho institucional, conhecido pelo humor expansivo.\n\nNOTA DA EQUIPE: falhas seletivas de resposta foram registradas em testes de rotina. Evitar alterar o roteiro sem autorização de Operações.`
    },
    'beth the spider': {
      title: 'BETH THE SPIDER',
      description: `Unidade planejada para interagir com elementos específicos do espaço infantil. O sistema de reconhecimento ocasionalmente classifica crianças como objetos do cenário.\n\nNOTA DA EQUIPE: restringir os testes e encaminhar qualquer ocorrência ao supervisor.`
    },
    'croko the crocodile': {
      title: 'CROKO THE CROCODILE',
      description: `Animatrônico sem pernas, mantido dentro de um barril durante apresentações. Repete sua canção em ciclos curtos.\n\nNOTA DA EQUIPE: funcionários relataram que algumas crianças seguem a música até a sala de Croko quando não há outros adultos por perto. O relatório completo não acompanha esta ficha.`
    },
    'lindy': {
      title: 'LINDY',
      description: `Assistente humanoide responsável por entregar pedidos, anotar solicitações e transmitir recados à cozinha.\n\nNOTA DA EQUIPE: foram relatados episódios em que Lindy fala de flores, recita poemas ou menciona o ano de 1997 sem contexto aparente.`
    },
    'junk': {
      title: 'JUNK',
      description: `Personagem de apoio representado por uma pequena lata de lixo rabugenta. Diversas unidades Mini Junk são distribuídas pelo estabelecimento.\n\nNOTA DA EQUIPE: as unidades foram encontradas fora de suas posições após o fechamento. Não há registro de movimentação autorizado para esse período.`
    }
  };

  const diagnostics = {
    'rosie the fox': `DIAGNÓSTICO — ROSIE THE FOX\nEstado nominal: operacional\nFalhas de comando: intermitentes\nÚltimo teste registrado: resultado inconsistente\nObservação: o registro de áudio contém 2,4 segundos sem origem identificada.`,
    'charles the wolf': `DIAGNÓSTICO — CHARLES THE WOLF\nEstado nominal: operacional\nSincronização de voz: instável em testes seletivos\nObservação: resposta registrada antes do envio de um comando em uma única sessão.`,
    'beth the spider': `DIAGNÓSTICO — BETH THE SPIDER\nEstado nominal: restrição recomendada\nClassificação de objetos: divergência documentada\nObservação: o pacote de correção não possui assinatura digital válida.`,
    'croko the crocodile': `DIAGNÓSTICO — CROKO THE CROCODILE\nEstado nominal: operacional com ressalvas\nRepetição de áudio: acima do limite previsto\nObservação: sensores internos registraram atividade durante uma janela marcada como vazia.`,
    'lindy': `DIAGNÓSTICO — LINDY\nEstado nominal: operacional\nMódulo de conversação: conteúdo fora do roteiro\nReferências detectadas: flores, poemas, 1997\nObservação: origem do texto não identificada.`,
    'junk': `DIAGNÓSTICO — JUNK / MINI JUNK\nEstado nominal: inconclusivo\nMovimentação após fechamento: relatos não confirmados\nObservação: o inventário não coincide com a última contagem física.`
  };

  const incidents = {
    'rosie the fox': `INCIDENTES — ROSIE THE FOX\nRegistro incompleto: testes com comandos divergentes.\nConclusão oficial: variação ambiental.\nAnexo técnico: indisponível.`,
    'charles the wolf': `INCIDENTES — CHARLES THE WOLF\nRegistro incompleto: resposta vocal fora do roteiro.\nConclusão oficial: falha de sincronização.\nAnexo técnico: removido da cópia distribuída.`,
    'beth the spider': `INCIDENTES — BETH THE SPIDER\nRegistro: divergência entre classificação de visitante e objeto.\nConclusão oficial: revisão de software necessária.\nObservação: a cópia pública não contém o relatório original.`,
    'croko the crocodile': `INCIDENTES — CROKO THE CROCODILE\nRegistro: funcionário encontrou uma criança na sala de Croko durante o fim de outubro de 1998.\nResumo da testemunha: a unidade interrompeu imediatamente a atividade quando o funcionário entrou.\nConclusão oficial: ocorrência em revisão. O anexo de câmera não está disponível.`,
    'lindy': `INCIDENTES — LINDY\nRegistro: unidade encontrada imóvel diante de uma parede, falando sobre flores.\nConclusão oficial: interação sem contexto identificável.\nAnexo: não localizado.`,
    'junk': `INCIDENTES — JUNK / MINI JUNK\nRegistro: unidades encontradas em locais diferentes dos pontos de inventário após o fechamento.\nConclusão oficial: erro de contagem.\nAnexo: ausente.`
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
      trashChecked: !!savedState.trashChecked
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(savedState)); }
    catch (e) { showToast('Não foi possível salvar localmente neste navegador.'); }
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      (data.discovered || []).forEach(x => discovered.add(x));
      (data.unlockedApps || []).forEach(x => unlockedApps.add(x));
      savedState.trashChecked = !!data.trashChecked;
    } catch (e) { showToast('O salvamento local não pôde ser lido.'); }
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
    const visible = $$('.file-item').filter(el => getComputedStyle(el).display !== 'none').length;
    $('#file-count').textContent = `${visible} objeto(s)`;
    const hint = $('.file-hint');
    if (hint && discovered.size) hint.textContent = 'Há registros adicionais no diretório. A lista foi atualizada.';
    if (savedState.trashChecked) $('#restore-note').textContent = 'Verificação concluída. Um item órfão foi localizado no diretório.';
    renderTrash();
  }
  function activateWindow(id) {
    const win = $(`[data-window="${id}"]`);
    if (!win) return;
    win.classList.add('open');
    win.style.zIndex = ++zIndex;
    $$('.task-button').forEach(b => b.classList.toggle('selected', b.dataset.task === id));
    if (! $(`[data-task="${id}"]`)) {
      const task = document.createElement('button');
      task.className = 'task-button selected';
      task.dataset.task = id;
      task.textContent = ({welcome:'Bem-vindo',files:'Arquivos',mail:'Correio',recycle:'Lixeira',terminal:'Terminal',reader:'Bloco de Notas',vision:'Rosie Vision'})[id] || id;
      task.addEventListener('click', () => {
        const target = $(`[data-window="${id}"]`);
        if (target && target.classList.contains('open')) closeWindow(id); else activateWindow(id);
      });
      taskButtons.appendChild(task);
    }
    if (id === 'terminal') setTimeout(() => input.focus(), 80);
  }
  function closeWindow(id) {
    const win = $(`[data-window="${id}"]`);
    if (win) win.classList.remove('open');
    const task = $(`[data-task="${id}"]`);
    if (task) task.remove();
  }
  function openDoc(name) {
    if (!docs[name]) { showToast('Arquivo não encontrado.'); return; }
    const unlockRequirements = {
      'maintenance.log':'maintenance.log',
      'incident_04.txt':'incident_04.txt',
      'archived_mail.txt':'archived_mail.txt',
      'mechanic_statement_07.txt':'mechanic_statement_07.txt',
      'animatronics_logs.txt':'animatronics_logs.txt',
      'rosie_vision.pkg':'rosie_vision.pkg'
    };
    if (unlockRequirements[name] && !discovered.has(unlockRequirements[name])) {
      showToast('O arquivo ainda não foi descoberto.');
      return;
    }
    $('#reader-title').textContent = name + ' — Bloco de Notas';
    $('#reader-content').textContent = docs[name];
    activateWindow('reader');
    if (name === 'maintenance.log' || name === 'incident_04.txt' || name === 'archived_mail.txt' || name === 'mechanic_statement_07.txt' || name === 'animatronics_logs.txt' || name === 'rosie_vision.pkg') {
      reveal(name);
    }
  }
  function addLine(text, cls='') {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }
  function printHelp() {
    addLine('Comandos disponíveis:');
    addLine('help | whoami | date | status | files | read <arquivo> | open <programa> | clear');
    addLine('backup export | backup import <código>');
    addLine('Comandos de catálogo: Animatronics Logs; Animatronics [Nome]; Animatronics Diagnostics; Animatronics Incidents');
    addLine('Acesso JUNK: alguns comandos estão bloqueados.');
  }
  function exportBackup() {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      format: 'RosieOSSave',
      version: '2.2.0',
      discovered: [...discovered],
      unlockedApps: [...unlockedApps],
      trashChecked: !!savedState.trashChecked
    }))));
    addLine('CÓDIGO DE BACKUP (guarde em local seguro):');
    addLine(payload);
    addLine('Para restaurar, use: backup import <código>');
  }
  function importBackup(code) {
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(code))));
      if (parsed.format !== 'RosieOSSave' || !Array.isArray(parsed.discovered)) throw new Error('Formato');
      discovered.clear();
      parsed.discovered.forEach(x => discovered.add(x));
      unlockedApps.clear();
      (parsed.unlockedApps || []).forEach(x => unlockedApps.add(x));
      savedState.trashChecked = !!parsed.trashChecked;
      persist();
      updateFiles();
      addLine('Backup importado. Descobertas restauradas.');
    } catch (e) { addLine('Backup inválido ou incompleto.', 'terminal-warning'); }
  }
  function runAnimatronics(command) {
    const trimmed = command.trim();
    const low = trimmed.toLowerCase();
    if (low === 'animatronics logs') {
      addLine('CATÁLOGO ANIMATRONICS — UNIDADE DA PENSILVÂNIA');
      addLine('Rosie The Fox | Charles The Wolf | Beth The Spider | Croko The Crocodile | Lindy | Junk');
      addLine('Dica: use Animatronics [Nome] para consultar uma ficha individual.');
      return true;
    }
    if (low === 'animatronics diagnostics' || low === 'animatronics incidents') {
      const type = low.endsWith('diagnostics') ? 'diagnostics' : 'incidents';
      const database = type === 'diagnostics' ? diagnostics : incidents;
      addLine(type === 'diagnostics' ? 'RELATÓRIOS TÉCNICOS — ÍNDICE PARCIAL' : 'INCIDENTES — ÍNDICE PARCIAL');
      Object.keys(database).forEach(name => addLine(name.toUpperCase() + ' — ' + database[name].split('\n')[1]));
      addLine('Use Animatronics ' + (type === 'diagnostics' ? 'Diagnostics' : 'Incidents') + ' [Nome] para abrir um registro individual.');
      return true;
    }
    const match = trimmed.match(/^animatronics\s+(diagnostics|incidents)\s+(.+)$/i);
    if (match) {
      const type = match[1].toLowerCase();
      const name = match[2].toLowerCase();
      const database = type === 'diagnostics' ? diagnostics : incidents;
      const entry = database[name];
      if (!entry) addLine('Registro individual não encontrado.');
      else entry.split('\n').forEach(line => addLine(line));
      return true;
    }
    const profile = trimmed.match(/^animatronics\s+(.+)$/i);
    if (profile && !['logs','diagnostics','incidents'].includes(profile[1].toLowerCase())) {
      const name = profile[1].toLowerCase();
      if (!animatronics[name]) addLine('Ficha não localizada no índice JUNK.');
      else animatronics[name].description.split('\n').forEach(line => addLine(line));
      return true;
    }
    return false;
  }
  function runCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    addLine('> ' + cmd);
    const low = cmd.toLowerCase();
    if (runAnimatronics(cmd)) {
      if (low === 'animatronics logs') reveal('animatronics_logs.txt');
      if (low === 'animatronics diagnostics' || low === 'animatronics incidents') showToast('Índice consultado. Algumas fichas continuam incompletas.');
      return;
    }
    if (low.startsWith('backup export')) { exportBackup(); return; }
    if (low.startsWith('backup import ')) { importBackup(cmd.slice('backup import '.length).trim()); return; }

    const parts = cmd.split(/\s+/);
    const base = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    switch (base) {
      case 'help': printHelp(); break;
      case 'whoami': addLine('JUNK'); addLine('Nível de autorização: 0 (temporário)'); break;
      case 'date': addLine(new Date().toLocaleString('pt-BR')); break;
      case 'status': addLine('ROSIE OS 2.2.0 | SISTEMA: OPERACIONAL | REDE: LOCAL'); addLine(`AVISOS: ${discovered.size} pista(s) descoberta(s), 1 item arquivado.`); break;
      case 'files':
      case 'dir':
      case 'ls':
        addLine('C:\\ROSIE\\JUNK\\DOCUMENTS');
        addLine('Welcome.txt  cafe_rules.txt  company_info.txt  staff_memo.txt');
        addLine('Dica: explore mensagens e registros; algumas pistas podem revelar outros arquivos.');
        break;
      case 'read': {
        if (!arg) { addLine('Uso: read <arquivo>'); break; }
        const name = Object.keys(docs).find(k => k.toLowerCase() === arg.toLowerCase());
        if (name) {
          const protectedNames = ['maintenance.log','incident_04.txt','archived_mail.txt','mechanic_statement_07.txt','animatronics_logs.txt','rosie_vision.pkg'];
          if (protectedNames.includes(name) && !discovered.has(name)) { addLine('Arquivo não encontrado ou acesso negado.'); break; }
          openDoc(name); addLine('Abrindo ' + name + '...');
        } else addLine('Arquivo não encontrado ou acesso negado.');
        break;
      }
      case 'open':
        if (arg.toLowerCase() === 'files' || arg.toLowerCase() === 'explorer') { activateWindow('files'); addLine('Explorador aberto.'); }
        else if (arg.toLowerCase() === 'mail') { activateWindow('mail'); addLine('Correio interno aberto.'); }
        else if (arg.toLowerCase() === 'notepad') { openDoc('welcome.txt'); addLine('Bloco de Notas aberto.'); }
        else if (arg.toLowerCase() === 'rosie vision' || arg.toLowerCase() === 'vision') {
          if (unlockedApps.has('rosie-vision')) { activateWindow('vision'); addLine('Rosie Vision iniciado.'); }
          else addLine('Programa não encontrado. O pacote de instalação não consta no menu JUNK.');
        } else addLine('Programa não encontrado. Digite "help".');
        break;
      case 'clear': output.innerHTML = ''; break;
      case 'sudo':
      case 'admin':
      case 'root':
        addLine('ACESSO NEGADO: credenciais insuficientes.', 'terminal-warning');
        addLine('Esta tentativa foi adicionada ao registro local.', 'terminal-warning');
        break;
      case 'system32':
      case 'rosie_core':
        addLine('Diretório não disponível para o nível JUNK.', 'terminal-warning');
        addLine('...mas por que esse nome aparece no histórico?', 'terminal-warning');
        reveal('maintenance.log');
        break;
      case 'override':
        addLine('ERRO 0x03: solicitação fora da política de acesso.', 'terminal-warning');
        addLine('Uma entrada foi adicionada ao diretório de manutenção.', 'terminal-warning');
        reveal('maintenance.log');
        break;
      case 'unlock':
        if (arg.toLowerCase() === 'rv-03-14') {
          unlockedApps.add('rosie-vision');
          reveal('rosie_vision.pkg');
          persist();
          addLine('Pacote Rosie Vision registrado no menu local.');
          addLine('Dica: use open vision para iniciar o programa.');
        } else {
          addLine('Formato inválido. Consulte a documentação de autorização.', 'terminal-warning');
        }
        break;
      case 'restore':
        if (arg.toLowerCase() === 'archive') {
          reveal('archived_mail.txt');
          addLine('Um item arquivado foi localizado.');
        } else addLine('Uso: restore archive');
        break;
      case 'lily':
      case 'flower':
        addLine('Nenhum resultado indexado para essa consulta.');
        addLine('O catálogo registra uma palavra semelhante em um documento indisponível.');
        break;
      default: addLine(`'${cmd}' não é reconhecido como comando interno ou externo.`);
    }
  }
  function renderTrash() {
    const container = $('#trash-items');
    if (!container) return;
    container.innerHTML = '';
    const items = ['archived_mail.txt','mechanic_statement_07.txt'];
    items.filter(name => discovered.has(name)).forEach(name => {
      const btn = document.createElement('button');
      btn.textContent = '📄 ' + name;
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
    task.className = 'task-button selected'; task.dataset.task = 'reader'; task.textContent = 'Bloco de Notas';
    task.addEventListener('click', () => activateWindow('reader'));
    taskButtons.appendChild(task);
  }

  loadSave();
  updateFiles();

  $$('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.open;
    startMenu.hidden = true;
    activateWindow(id);
  }));
  $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeWindow(btn.dataset.close)));
  $$('[data-minimize]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.minimize;
    const win = $(`[data-window="${id}"]`);
    if (win) win.classList.remove('open');
  }));
  $$('[data-doc]').forEach(btn => btn.addEventListener('click', () => {
    startMenu.hidden = true;
    openDoc(btn.dataset.doc);
    if ($('#reader').classList.contains('open')) ensureReaderTask();
  }));
  $('#start-button').addEventListener('click', () => { startMenu.hidden = !startMenu.hidden; });
  document.addEventListener('click', e => {
    if (!startMenu.hidden && !startMenu.contains(e.target) && !$('#start-button').contains(e.target)) startMenu.hidden = true;
  });
  $('#terminal-form').addEventListener('submit', e => {
    e.preventDefault(); runCommand(input.value); input.value = '';
  });
  $('#restore-button').addEventListener('click', () => {
    savedState.trashChecked = true;
    reveal('incident_04.txt');
    reveal('mechanic_statement_07.txt');
    updateFiles();
    persist();
    $('#restore-note').textContent = 'Verificação concluída. Um item órfão foi localizado em C:\\ROSIE\\JUNK\\DOCUMENTS.';
    showToast('Verificação concluída. Um registro parcial foi recuperado.');
  });
  $('#logoff-button').addEventListener('click', () => {
    startMenu.hidden = true; $('#shutdown-screen').hidden = false;
  });
  $('#login-again').addEventListener('click', () => {
    $('#shutdown-screen').hidden = true; activateWindow('welcome'); showToast('Sessão iniciada: JUNK');
  });
  function updateClock() { $('#clock').textContent = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
  updateClock(); setInterval(updateClock, 15000);

  // Make windows draggable on larger screens while keeping the titlebar touch-friendly.
  windows.forEach(win => {
    const bar = $('.titlebar', win);
    let startX=0,startY=0,left=0,top=0,dragging=false;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || window.matchMedia('(max-width:650px)').matches) return;
      dragging=true; startX=e.clientX; startY=e.clientY;
      left=win.offsetLeft; top=win.offsetTop; win.style.zIndex=++zIndex;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      win.style.left=Math.max(0,Math.min(window.innerWidth-win.offsetWidth,left+e.clientX-startX))+'px';
      win.style.top=Math.max(0,Math.min(window.innerHeight-win.offsetHeight-40,top+e.clientY-startY))+'px';
    });
    bar.addEventListener('pointerup', () => dragging=false);
    bar.addEventListener('pointercancel', () => dragging=false);
  });
})();
