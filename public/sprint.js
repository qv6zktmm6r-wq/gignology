(() => {
  'use strict';
  const root = document.querySelector('[data-sprint-preview]');
  if (!root) return;
  const panel = root.querySelector('[role="tabpanel"]');
  const tabs = Array.from(root.querySelectorAll('[data-sprint-tab]'));
  if (!panel || !tabs.length) return;
  const documents = {
    inventory: {
      category: 'KNOW YOUR AI LANDSCAPE', title: 'AI-use inventory',
      intro: 'A consistent record of the AI tools, uses, and data boundaries across your organization.',
      rows: [
        ['Tool or model', 'Provider, product, and approved environment'],
        ['Business use', 'Purpose, workflow, and people affected'],
        ['Data boundary', 'Information entered, retained, or shared'],
        ['Ownership', 'Accountable owner and review responsibility']
      ],
      decision: 'Which AI uses need closer review before adoption expands?'
    },
    governance: {
      category: 'SET THE RULES FOR ADOPTION', title: 'Governance & approval',
      intro: 'A policy and review structure that makes responsibilities and boundaries clear.',
      rows: [
        ['Permitted use', 'Acceptable uses and restricted information'],
        ['Review gate', 'When approval is needed and who reviews'],
        ['Human oversight', 'Required checks before acting on AI output'],
        ['Escalation', 'How concerns and exceptions are handled']
      ],
      decision: 'Who can approve an AI use, and what needs to be checked first?'
    },
    risk: {
      category: 'MAKE RISK VISIBLE', title: 'Initial risk register',
      intro: 'A shared record that connects identified concerns to ownership and follow-through.',
      rows: [
        ['Risk statement', 'The concern, cause, and possible consequence'],
        ['Risk evaluation', 'How likelihood and impact will be considered'],
        ['Response & owner', 'Proposed controls and accountable lead'],
        ['Review record', 'Status, supporting evidence, and next review']
      ],
      decision: 'Which risks deserve attention, and who owns the next action?'
    },
    roadmap: {
      category: 'GIVE THE NEXT 90 DAYS DIRECTION', title: 'Executive roadmap',
      intro: 'A prioritized action structure that links governance gaps to practical next steps.',
      rows: [
        ['Baseline', 'Confirm scope, current practices, and key gaps'],
        ['Govern', 'Prioritize policies, approvals, and ownership'],
        ['Implement', 'Sequence controls, evidence, and team enablement'],
        ['Measure', 'Define review points and leadership reporting']
      ],
      decision: 'What should move first, what depends on it, and how will progress be reviewed?'
    }
  };
  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function select(tab, focus = false) {
    const data = documents[tab.dataset.sprintTab];
    if (!data) return;
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    const table = make('table', 'sprint-preview__table');
    table.append(make('caption', 'sprint-preview__sr-only', `Illustrative fields in ${data.title.toLowerCase()}`));
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Document field', 'What it captures'].forEach(text => {
      const cell = make('th', '', text); cell.scope = 'col'; headRow.append(cell);
    });
    head.append(headRow);
    const body = document.createElement('tbody');
    data.rows.forEach(([label, description]) => {
      const row = document.createElement('tr');
      const labelCell = make('th', '', label); labelCell.scope = 'row';
      row.append(labelCell, make('td', '', description)); body.append(row);
    });
    table.append(head, body);
    const decision = make('div', 'sprint-preview__decision');
    decision.append(make('span', '', 'The decision it supports'), make('p', '', data.decision));
    panel.replaceChildren(
      make('div', 'sprint-preview__doc-category', data.category),
      make('h3', '', data.title),
      make('p', 'sprint-preview__doc-intro', data.intro),
      table,
      decision,
      make('p', 'sprint-preview__sample-note', 'Sample document structure, not a client assessment or completed deliverable.')
    );
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); select(tabs[next], true);
    });
  });
})();
