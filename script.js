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
  const LEGACY_KEYS = ['rosieOS22.save', 'rosieOS21.save'];
  let zIndex = 5;
  let toastTimer;
  const discovered = new Set();
  const unlockedApps = new Set();
  let savedState = { discovered: [], unlockedApps: [], trashChecked: false, rank: 'JUNK', fisherBugs: [], fisherScore: 0, promotionMail: false };

  const docs = {
    'depoimentos_1998.txt': `DEPOIMENTOS INTERNOS — 1998\n\nMARCO — Relatou que alguns funcionários foram encontrados fumando fora do horário de almoço. Ocorrência encaminhada à administração.\n\nFAXINEIRO — Declarou ter ouvido uma criança falando sozinha na sala de Croko. Ao verificar o local, não encontrou ninguém.\n\nGUARDA NOTURNA — Por volta das 04:42, a guarda estava jogando Fisher quando a senha Bubbli deixou de funcionar temporariamente. Depois de ouvir barulhos estranhos, abriu o monitoramento para verificar o local e viu animatrônicos do palco principal ativarem sozinhos por alguns instantes antes de desligarem.\n\n[REGISTRO PARCIAL]`,
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
      trashChecked: !!savedState.trashChecked,
      rank: savedState.rank || 'JUNK', fisherBugs: savedState.fisherBugs || [], fisherScore: savedState.fisherScore || 0, promotionMail: !!savedState.promotionMail
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(savedState)); }
    catch (e) { showToast('Não foi possível salvar localmente neste navegador.'); }
  }
  function loadSave() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      let migrated = false;
      if (!raw) {
        for (const key of LEGACY_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) { migrated = true; break; }
        }
      }
      if (!raw) return;
      const data = JSON.parse(raw);
      (Array.isArray(data.discovered) ? data.discovered : []).forEach(x => discovered.add(x));
      (Array.isArray(data.unlockedApps) ? data.unlockedApps : []).forEach(x => unlockedApps.add(x));
      savedState.trashChecked = !!data.trashChecked;
      savedState.rank = data.rank === 'LINDY' ? 'LINDY' : 'JUNK';
      savedState.fisherBugs = Array.isArray(data.fisherBugs) ? [...new Set(data.fisherBugs.filter(n => Number.isInteger(n) && n >= 1 && n <= 5))] : [];
      savedState.fisherScore = Math.max(0, Number(data.fisherScore) || 0);
      savedState.promotionMail = !!data.promotionMail || savedState.fisherBugs.length >= 5 && savedState.rank === 'LINDY';
      if (migrated) persist();
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
    const fisherItem = $('#fisher-trash-item');
    if (fisherItem) fisherItem.hidden = !discovered.has('depoimentos_1998.txt');
    const archiveButton = $('#archived-mail-button');
    const archiveHint = $('#mail-archive-hint');
    if (archiveButton) {
      const archiveFound = discovered.has('archived_mail.txt');
      archiveButton.disabled = !archiveFound;
      archiveButton.textContent = archiveFound ? 'Abrir mensagem arquivada' : 'Mensagem arquivada · indisponível';
      if (archiveHint) archiveHint.textContent = archiveFound ? 'Registro recuperado. Abra a mensagem para ler o conteúdo.' : 'Dica: procure uma função de recuperação no terminal.';
    }
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
      task.textContent = ({welcome:'Bem-vindo',files:'Arquivos',mail:'Correio',recycle:'Lixeira',terminal:'Terminal',reader:'Bloco de Notas',vision:'Rosie Vision',fisher:'Fisher.exe'})[id] || id;
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
    if (name === 'depoimentos_1998.txt') { reveal('depoimentos_1998.txt'); updateFiles(); }
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
    const rank = savedState.rank || 'JUNK';
    addLine('Comandos disponíveis para o perfil ' + rank + ':');
    addLine('help | whoami | date | status | files | read <arquivo> | open <programa> | clear');
    addLine('Correio: open mail | Depoimentos: Depoimento');
    if (discovered.has('depoimentos_1998.txt')) addLine('Aplicativo recuperado: Fisher.exe (consulte a Lixeira ou use open fisher).');
    addLine('backup export | backup import <código>');
    if (rank === 'LINDY') {
      addLine('Animatronics Logs | Animatronics [Nome] | Animatronics Diagnostics | Animatronics Incidents');
      addLine('Câmeras: Cameras | Ativação de Rosie Vision: unlock rv-03-14');
    } else addLine('Acesso JUNK: comandos de animatrônicos e monitoramento indisponíveis.');
  }
  function exportBackup() {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      format: 'RosieOSSave',
      version: '2.3.2',
      discovered: [...discovered],
      unlockedApps: [...unlockedApps],
      trashChecked: !!savedState.trashChecked, rank: savedState.rank || 'JUNK', fisherBugs: savedState.fisherBugs || [], fisherScore: savedState.fisherScore || 0, promotionMail: !!savedState.promotionMail
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
      savedState.rank = parsed.rank === 'LINDY' ? 'LINDY' : 'JUNK';
      savedState.fisherBugs = Array.isArray(parsed.fisherBugs) ? parsed.fisherBugs : [];
      savedState.fisherScore = Number(parsed.fisherScore) || 0;
      savedState.promotionMail = !!parsed.promotionMail;
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
    // Aceita tanto "open mail" quanto ">open mail".
    const cmd = raw.trim().replace(/^>\s*/, '');
    if (!cmd) return;
    addLine('> ' + cmd);
    const low = cmd.toLowerCase();
    if (/^animatronics\b/i.test(cmd) && savedState.rank !== 'LINDY') { addLine('ACESSO NEGADO: o catálogo de animatrônicos exige nível LINDY.', 'terminal-warning'); return; }
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
      case 'whoami': addLine('Usuário atual'); addLine('Nível de autorização: ' + (savedState.rank || 'JUNK')); break;
      case 'date': addLine(new Date().toLocaleString('pt-BR')); break;
      case 'status': addLine('ROSIE OS 2.3.2 | SISTEMA: OPERACIONAL | REDE: LOCAL'); addLine(`AVISOS: ${discovered.size} pista(s) descoberta(s), 1 item arquivado.`); break;
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
      case 'depoimento':
        addLine('DEPOIMENTOS DISPONÍVEIS — 1998');
        addLine('Depoimento 01 — Marco: ocorrência disciplinar envolvendo funcionários fora do horário de almoço.');
        addLine('Depoimento 02 — Limpeza: relato de uma criança falando sozinha na sala de Croko.');
        addLine('Depoimento 03 — Segurança noturna: falha de autenticação no Fisher, ruídos após as 04:42 e atividade inesperada no palco principal.');
        addLine('Abrindo o registro completo da guarda noturna...');
        openDoc('depoimentos_1998.txt');
        break;
      case 'cameras':
      case 'camera':
        if (savedState.rank !== 'LINDY') { addLine('ACESSO NEGADO: monitoramento exige nível LINDY.', 'terminal-warning'); break; }
        if (!unlockedApps.has('rosie-vision')) { addLine('Aplicativo de monitoramento não inicializado.'); addLine('O comando de ativação não consta na lista básica.'); }
        else { activateWindow('vision'); addLine('Rosie Vision iniciado.'); }
        break;
      case 'open':
        if (arg.toLowerCase() === 'files' || arg.toLowerCase() === 'explorer') { activateWindow('files'); addLine('Explorador aberto.'); }
        else if (arg.toLowerCase() === 'mail' || arg.toLowerCase() === 'correio') { activateWindow('mail'); addLine('Correio interno aberto. 1 mensagem nova.'); }
        else if (arg.toLowerCase() === 'notepad') { openDoc('welcome.txt'); addLine('Bloco de Notas aberto.'); }
        else if (arg.toLowerCase() === 'fisher' || arg.toLowerCase() === 'fisher.exe') { if (!discovered.has('depoimentos_1998.txt')) { addLine('Programa não encontrado. Nenhuma referência ao aplicativo consta no índice atual.'); break; } openFisherGame(); addLine('Fisher Arcade iniciado.'); }
        else if (arg.toLowerCase() === 'rosie vision' || arg.toLowerCase() === 'vision' || arg.toLowerCase() === 'cameras') {
          if (savedState.rank !== 'LINDY') { addLine('Acesso negado: nível LINDY necessário.', 'terminal-warning'); break; }
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
        if (savedState.rank !== 'LINDY') { addLine('Acesso negado: nível LINDY necessário.', 'terminal-warning'); break; }
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
  const cameraList = [
    'CAM-01 · PALCO PRINCIPAL', 'CAM-02 · SALÃO PRINCIPAL', 'CAM-03 · COZINHA',
    'CAM-04 · CORREDOR DAS ATRAÇÕES', 'CAM-05 · SALA DE CROKO', 'CAM-06 · PLAYGROUND DE BETH',
    'CAM-07 · ARCADES', 'CAM-08 · CORREDOR DE SERVIÇO'
  ];
  let cameraIndex = 0;
  function renderCamera() {
    const name = $('#camera-name'); if (!name) return;
    name.textContent = cameraList[cameraIndex];
    $('#camera-index').textContent = String(cameraIndex + 1).padStart(2,'0') + ' / ' + String(cameraList.length).padStart(2,'0');
    $('#camera-state').textContent = 'SEM SINAL';
    $('#camera-timestamp').textContent = cameraIndex === 4 && savedState.rank === 'LINDY' ? 'REC: 04:42:09' : 'REC: --:--:--';
    $('#camera-statusbar').textContent = cameraList.length + ' câmeras registradas · sinal indisponível';
  }
  function updateRankUI() {
    const rank = savedState.rank || 'JUNK';
    const w = $('#welcome-rank'); if (w) w.textContent = rank;
    const t = $('#terminal-rank'); if (t) t.textContent = rank;
    const startUser = $('.start-user strong'); if (startUser) startUser.textContent = rank;
    const startSmall = $('.start-user small'); if (startSmall) startSmall.textContent = rank === 'LINDY' ? 'Funcionário autorizado' : 'Funcionário temporário';
    const startAccess = $('.start-links .tiny'); if (startAccess) startAccess.textContent = 'Acesso: ' + rank;
    const welcomeText = $('.welcome-body .notice');
    if (welcomeText) welcomeText.innerHTML = '<strong>Conta atual:</strong> ' + rank + ' <span class="level-pill">NÍVEL DE ACESSO ' + (rank === 'LINDY' ? '1' : '0') + '</span><br><small>Alguns recursos estão indisponíveis para este usuário.</small>';
    const mail = $('#promotion-mail'); if (mail) mail.hidden = !savedState.promotionMail;
    const status = $('#mail-status'); if (status && savedState.promotionMail) status.textContent = '1 mensagem nova';
    const fisherStatus = $('#fisher-status'); if (fisherStatus) fisherStatus.textContent = savedState.fisherBugs?.length >= 5 ? 'Análise concluída' : 'Aplicativo recuperado';
  }
  function deliverPromotion() {
    if (savedState.promotionMail) return;
    savedState.rank = 'LINDY';
    savedState.promotionMail = true;
    persist(); updateRankUI();
    $('#fisher-message').textContent = 'Sessão encerrada inesperadamente.';
    $('#fisher-status').textContent = 'Aplicativo fechado';
    windows.forEach(win => { win.classList.remove('open'); win.classList.remove('active-window'); });
    showToast('Nova mensagem recebida: Atualização de nível de acesso.');
    $('#mail-status').textContent = '1 mensagem nova';
  }
  const fisherTargets = [
    {type:'fish', label:'🐟', points:10}, {type:'bomb', label:'💣'}, {type:'fish', label:'🐠', points:15},
    {type:'bug', label:'🐟', bug:1}, {type:'fish', label:'🐡', points:10}, {type:'bug', label:'◈', bug:2},
    {type:'bomb', label:'💣'}, {type:'fish', label:'🐟', points:20}, {type:'bug', label:'░', bug:3},
    {type:'fish', label:'🐠', points:10}, {type:'bug', label:'?', bug:4}, {type:'fish', label:'🐟', points:15},
    {type:'bomb', label:'💣'}, {type:'bug', label:'▧', bug:5}, {type:'fish', label:'🐡', points:20}
  ];
  function renderFisherBoard() {
    const board = $('#fisher-board'); if (!board) return;
    board.innerHTML = '';
    fisherTargets.forEach((target, i) => {
      const button = document.createElement('button');
      button.className = 'fisher-target ' + target.type;
      button.type = 'button'; button.textContent = target.label;
      button.setAttribute('aria-label', target.type === 'bug' ? 'Elemento com falha visual' : target.type === 'bomb' ? 'Bomba' : 'Peixe de vidro');
      if (target.type === 'bug' && (savedState.fisherBugs || []).includes(target.bug)) { button.classList.add('found'); button.disabled = true; }
      button.addEventListener('click', () => {
        if (target.type === 'fish') { savedState.fisherScore = (savedState.fisherScore || 0) + target.points; $('#fisher-score').textContent = String(savedState.fisherScore).padStart(3,'0'); $('#fisher-message').textContent = '+' + target.points + ' pontos!'; button.disabled = true; button.classList.add('caught'); }
        else if (target.type === 'bomb') { savedState.fisherScore = Math.max(0,(savedState.fisherScore || 0)-10); $('#fisher-score').textContent = String(savedState.fisherScore).padStart(3,'0'); $('#fisher-message').textContent = 'Bomba! Você perdeu 10 pontos.'; button.disabled = true; button.classList.add('caught'); }
        else {
          const bugs = savedState.fisherBugs || [];
          if (!bugs.includes(target.bug)) bugs.push(target.bug);
          savedState.fisherBugs = bugs; button.classList.add('found'); button.disabled = true;
          $('#fisher-bug-count').textContent = bugs.length + '/5';
          $('#fisher-message').textContent = bugs.length < 5 ? 'Falha visual registrada. O jogo parece continuar normalmente.' : 'ERRO: integridade do aplicativo comprometida.';
          if (bugs.length >= 5) { persist(); setTimeout(deliverPromotion, 900); }
        }
        persist();
      });
      board.appendChild(button);
    });
    $('#fisher-score').textContent = String(savedState.fisherScore || 0).padStart(3,'0');
    $('#fisher-bug-count').textContent = (savedState.fisherBugs || []).length + '/5';
    if ((savedState.fisherBugs || []).length >= 5 && !savedState.promotionMail) setTimeout(deliverPromotion, 500);
  }
  function openFisherGame() {
    if (!discovered.has('depoimentos_1998.txt')) { showToast('Nenhuma referência ao Fisher foi descoberta.'); return; }
    activateWindow('fisher');
    $('#fisher-lock').hidden = false; $('#fisher-game').hidden = true;
    $('#fisher-password').value = ''; $('#fisher-password-error').textContent = '';
    $('#fisher-status').textContent = 'Aguardando autenticação';
  }
  $('#fisher-trash-item')?.addEventListener('click', openFisherGame);
  $('#fisher-password-form')?.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#fisher-password').value.trim().toLowerCase() !== 'bubbli') {
      $('#fisher-password-error').textContent = 'Senha incorreta.'; return;
    }
    $('#fisher-lock').hidden = true; $('#fisher-game').hidden = false;
    $('#fisher-status').textContent = 'Sessão de jogo ativa';
    $('#fisher-password-error').textContent = '';
    renderFisherBoard();
  });
  $('#fisher-reset')?.addEventListener('click', () => {
    savedState.fisherScore = 0; persist(); renderFisherBoard(); $('#fisher-message').textContent = 'Nova partida iniciada.';
  });
  $('#camera-prev')?.addEventListener('click', () => { cameraIndex = (cameraIndex - 1 + cameraList.length) % cameraList.length; renderCamera(); });
  $('#camera-next')?.addEventListener('click', () => { cameraIndex = (cameraIndex + 1) % cameraList.length; renderCamera(); });

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

  // Tela de inicialização restaurada. O ambiente continua funcional mesmo se o som estiver indisponível.
  const bootScreen = $('#boot-screen');
  const bootLog = $('#boot-log');
  const bootProgress = $('#boot-progress');
  const bootStatus = $('#boot-status');
  const bootSoundButton = $('#boot-sound');
  let bootSoundEnabled = false;
  let bootAudio = null;
  function bootBeep(frequency=660, duration=0.055) {
    if (!bootSoundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      bootAudio ||= new AudioContext();
      if (bootAudio.state === 'suspended') bootAudio.resume();
      const oscillator = bootAudio.createOscillator();
      const gain = bootAudio.createGain();
      oscillator.type = 'square'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, bootAudio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, bootAudio.currentTime + duration);
      oscillator.connect(gain); gain.connect(bootAudio.destination);
      oscillator.start(); oscillator.stop(bootAudio.currentTime + duration);
    } catch (_) { /* Áudio opcional, não bloqueia a inicialização. */ }
  }
  if (bootSoundButton) bootSoundButton.addEventListener('click', () => {
    bootSoundEnabled = !bootSoundEnabled;
    bootSoundButton.textContent = bootSoundEnabled ? '♫ Som: ligado' : '♫ Som: desligado';
    bootSoundButton.setAttribute('aria-pressed', String(bootSoundEnabled));
    bootBeep(740, 0.08);
  });
  function runBootSequence() {
    if (!bootScreen || !bootLog || !bootProgress || !bootStatus) return;
    const lines = [
      ['ROSIE CAFÉ CORPORATE SYSTEMS [2.3.2]', ''],
      ['Verificando ambiente local...', ''],
      ['Carregando interface de trabalho...', ''],
      ['Sincronização externa: indisponível (modo local).', 'boot-warning'],
      ['Verificando índice de arquivos e permissões...', ''],
      ['Sessão JUNK preparada.', ''],
      ['Inicialização concluída.', '']
    ];
    let index = 0;
    const step = () => {
      if (index >= lines.length) {
        bootStatus.textContent = 'Pronto.'; bootProgress.style.width = '100%'; bootBeep(880, 0.09);
        window.setTimeout(() => { bootScreen.classList.add('boot-finished'); window.setTimeout(() => { bootScreen.hidden = true; }, 700); }, 300);
        return;
      }
      const [message, cls] = lines[index];
      const line = document.createElement('p'); if (cls) line.className = cls; line.textContent = '> ' + message; bootLog.appendChild(line);
      index++; bootProgress.style.width = Math.round(index / lines.length * 100) + '%';
      bootStatus.textContent = index === lines.length ? 'Finalizando...' : 'Carregando componente ' + index + '/' + lines.length;
      bootBeep(440 + index * 35, 0.045);
      window.setTimeout(step, 360);
    };
    window.setTimeout(step, 250);
  }

  loadSave();
  updateFiles();
  updateRankUI();
  renderCamera();

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
  runBootSequence();

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
