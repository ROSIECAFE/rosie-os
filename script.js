(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const windows = $$('.window');
  const startMenu = $('#start-menu');
  const output = $('#terminal-output');
  const input = $('#terminal-input');
  const toast = $('#toast');
  const taskButtons = $('#task-buttons');
  let zIndex = 5;
  let toastTimer;
  const discovered = new Set();
  const docs = {
    'welcome.txt': `ROSIE CAFÉ CORPORATION\n\nSeja bem-vindo à família Rosie!\n\nNossa missão é tornar cada pausa mais doce. A qualidade começa nos pequenos detalhes: um sorriso, uma mesa limpa e um relatório preenchido corretamente.\n\nLembrete: sua conta atual possui acesso JUNK. Consulte seu supervisor para solicitar permissões adicionais.\n\nTenha um excelente turno!`,
    'cafe_rules.txt': `ROSIE CAFÉ — REGRAS DA CASA\nVersão pública 2.1\n\n1. Trate todos os clientes com gentileza.\n2. Registre perdas e ocorrências no fim do turno.\n3. Não entre em áreas sinalizadas como RESTRITO.\n4. Não desligue equipamentos sem autorização.\n5. Se ouvir o telefone tocar em uma sala vazia, informe a supervisão.\n\nA regra 5 foi incluída por solicitação do departamento de operações.\nNão é necessário perguntar o motivo.`,
    'company_info.txt': `ROSIE CAFÉ CORPORATION\n\nFundação: registro interno indisponível\nDireção: Nathan [sobrenome omitido]\nCoordenação de projetos: Christopher\nDepartamento: Operações e Experiência\n\nA Rosie Café cresceu graças à dedicação de pessoas que acreditam em um ambiente acolhedor. Nossos parques, cafés e espaços de entretenimento devem ser seguros, alegres e memoráveis.\n\nNota administrativa: documentos de manutenção não fazem parte do pacote JUNK.`,
    'staff_memo.txt': `MEMORANDO INTERNO\nPara: equipe de apoio\nDe: Christopher\n\nPor favor, mantenham as cópias dos relatórios em ordem cronológica. Nathan quer que a inauguração seja impecável.\n\nUma observação: o arquivo de inventário voltou a aparecer depois de ter sido removido. A equipe de TI diz que é um erro de sincronização. Não percam tempo com isso.\n\n— Christopher`,
    'maintenance.log': `[LOG DE MANUTENÇÃO — CÓPIA PARCIAL]\n\n03:14:08 | Unidade C-04 reiniciada sem solicitação.\n03:14:11 | Áudio detectado em corredor vazio.\n03:14:12 | Operador: "Quem está aí?"\n03:14:14 | Áudio detectado novamente.\n03:14:15 | Operador encerrou a sessão.\n03:14:16 | SISTEMA: não havia operador conectado.\n\n[REGISTRO INTERROMPIDO]\n\nNota: este documento não deveria estar visível para o nível JUNK.`,
    'incident_04.txt': `INCIDENTE 04 — ACESSO RESTRITO\n\nO relatório oficial descreve o evento como uma falha elétrica de curta duração.\n\nA cópia de segurança contém uma linha adicional:\n"Ela sabia o nome do funcionário antes que ele se apresentasse."\n\nA linha foi removida da versão enviada à diretoria.\n\nSe este arquivo apareceu na sua pasta, não o mova para a rede compartilhada.\n\nFIM DO DOCUMENTO`,
    'archived_mail.txt': `MENSAGEM ARQUIVADA\nRemetente: [REMOVIDO]\nData: 17/10 — horário não sincronizado\nAssunto: O diretório que não existe\n\nChristopher,\n\nA pasta voltou. Eu apaguei três vezes, e ela continua surgindo depois das 03:14. Desta vez havia um arquivo com meu nome. Não abri.\n\nPor favor, não diga que é outro problema de sincronização.\n\n— N.`
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function activateWindow(id) {
    const win = $(`[data-window="${id}"]`);
    if (!win) return;
    win.classList.add('open');
    win.style.zIndex = ++zIndex;
    $$('.task-button').forEach(b => b.classList.toggle('selected', b.dataset.task === id));
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
    $('#reader-title').textContent = name + ' — Bloco de Notas';
    $('#reader-content').textContent = docs[name];
    activateWindow('reader');
    if (name === 'maintenance.log' || name === 'incident_04.txt' || name === 'archived_mail.txt') {
      discovered.add(name);
      updateFiles();
      showToast('Arquivo aberto. Uma nova pista foi registrada.');
    }
  }
  function updateFiles() {
    $$('.hidden-file').forEach(el => {
      if (discovered.has('maintenance.log') || discovered.has('archived_mail.txt')) el.style.display = 'flex';
    });
    const hint = $('.file-hint');
    if (hint && discovered.size) hint.textContent = 'Há registros adicionais no diretório. A lista foi atualizada.';
  }
  function addLine(text, cls='') {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }
  function runCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    addLine('> ' + cmd);
    const parts = cmd.split(/\s+/);
    const base = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    switch (base) {
      case 'help':
        addLine('Comandos disponíveis:');
        addLine('help  |  whoami  |  date  |  status  |  files');
        addLine('read <arquivo>  |  open <programa>  |  clear');
        addLine('Acesso JUNK: alguns comandos estão bloqueados.');
        break;
      case 'whoami': addLine('JUNK'); addLine('Nível de autorização: 0 (temporário)'); break;
      case 'date': addLine(new Date().toLocaleString('pt-BR')); break;
      case 'status': addLine('ROSIE OS 2.1.0 | SISTEMA: OPERACIONAL | REDE: LOCAL'); addLine('AVISOS: 1 item arquivado, 2 alertas ignorados.'); break;
      case 'files': addLine('C:\\ROSIE\\JUNK\\DOCUMENTS'); addLine('Welcome.txt  cafe_rules.txt  company_info.txt  staff_memo.txt'); addLine('Dica: explore os arquivos e as mensagens arquivadas.'); break;
      case 'read': {
        if (!arg) { addLine('Uso: read <arquivo>'); break; }
        const name = arg.toLowerCase();
        const match = Object.keys(docs).find(k => k.toLowerCase() === name);
        if (match) { openDoc(match); addLine('Abrindo ' + match + '...'); }
        else addLine('Arquivo não encontrado ou acesso negado.');
        break;
      }
      case 'open':
        if (arg.toLowerCase() === 'files' || arg.toLowerCase() === 'explorer') { activateWindow('files'); addLine('Explorador aberto.'); }
        else if (arg.toLowerCase() === 'mail') { activateWindow('mail'); addLine('Correio interno aberto.'); }
        else if (arg.toLowerCase() === 'notepad') { openDoc('welcome.txt'); addLine('Bloco de Notas aberto.'); }
        else addLine('Programa não encontrado. Digite "help".');
        break;
      case 'clear': output.innerHTML = ''; break;
      case 'sudo':
      case 'admin':
      case 'root':
        addLine('ACESSO NEGADO: credenciais insuficientes.', 'terminal-warning');
        addLine('Esta tentativa foi adicionada ao registro local.', 'terminal-warning');
        break;
      case 'dir':
      case 'ls': addLine('Welcome.txt  cafe_rules.txt  company_info.txt  staff_memo.txt'); break;
      case 'system32':
      case 'rosie_core':
        addLine('Diretório não disponível para o nível JUNK.', 'terminal-warning');
        addLine('...mas por que esse nome aparece no histórico?', 'terminal-warning');
        discovered.add('maintenance.log'); updateFiles();
        break;
      case 'override':
        addLine('ERRO 0x03: solicitação fora da política de acesso.', 'terminal-warning');
        addLine('Uma entrada foi adicionada ao diretório de manutenção.', 'terminal-warning');
        discovered.add('maintenance.log'); updateFiles();
        break;
      case 'unlock':
        addLine('Formato inválido. Consulte a documentação de autorização.', 'terminal-warning');
        break;
      default: addLine(`'${cmd}' não é reconhecido como comando interno ou externo.`);
    }
  }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.open;
    startMenu.hidden = true;
    activateWindow(id);
    if (! $(`[data-task="${id}"]`)) {
      const task = document.createElement('button');
      task.className = 'task-button selected';
      task.dataset.task = id;
      task.textContent = ({welcome:'Bem-vindo',files:'Arquivos',mail:'Correio',recycle:'Lixeira',terminal:'Terminal'})[id] || id;
      task.addEventListener('click', () => {
        const win = $(`[data-window="${id}"]`);
        if (win && win.classList.contains('open')) closeWindow(id); else activateWindow(id);
      });
      taskButtons.appendChild(task);
    }
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
    if (! $(`[data-task="reader"]`)) {
      const task = document.createElement('button');
      task.className = 'task-button selected'; task.dataset.task = 'reader'; task.textContent = 'Bloco de Notas';
      task.addEventListener('click', () => activateWindow('reader'));
      taskButtons.appendChild(task);
    }
  }));
  $('#start-button').addEventListener('click', () => { startMenu.hidden = !startMenu.hidden; });
  document.addEventListener('click', e => {
    if (!startMenu.hidden && !startMenu.contains(e.target) && !$('#start-button').contains(e.target)) startMenu.hidden = true;
  });
  $('#terminal-form').addEventListener('submit', e => {
    e.preventDefault(); runCommand(input.value); input.value = '';
  });
  $('#restore-button').addEventListener('click', () => {
    discovered.add('maintenance.log'); discovered.add('incident_04.txt'); updateFiles();
    $('#restore-note').textContent = 'Verificação concluída. Um item órfão foi localizado em C:\\ROSIE\\JUNK\\DOCUMENTS.';
    showToast('1 item do sistema foi restaurado.');
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