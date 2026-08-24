import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'relife-schema-studio-v1';
const TYPES = ['INT', 'BIGINT', 'VARCHAR(50)', 'VARCHAR(100)', 'VARCHAR(255)', 'TEXT', 'DECIMAL(10,2)', 'DATE', 'DATETIME', 'BOOLEAN'];
const LIST_TYPES = [
  { value: 'LIST:VARCHAR(255)', label: 'Liste de textes' },
  { value: 'LIST:INT', label: 'Liste d’entiers' },
  { value: 'LIST:DECIMAL(10,2)', label: 'Liste de décimaux' },
  { value: 'LIST:BOOLEAN', label: 'Liste de booléens' },
];
const MULTIPLICITIES = ['1', '*', '0..1', '0..*'];
const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6', '#06b6d4', '#f43f5e', '#f97316', '#8b5cf6', '#64748b'];

const starterTables = [
  { id: 'article', name: 'Article', x: 300, y: 190, color: '#3b82f6', columns: [
    { id: 'article-id', name: 'ID', type: 'INT', isPK: true },
    { id: 'article-taille', name: 'Taille', type: 'VARCHAR(10)' },
    { id: 'article-reference', name: 'Reference', type: 'VARCHAR(50)' },
    { id: 'article-prix', name: 'PrixReprise', type: 'DECIMAL(10,2)' },
    { id: 'article-marque', name: 'Id_Marque', type: 'INT', isFK: true, refTable: 'marque' },
    { id: 'article-color', name: 'Id_Color', type: 'INT', isFK: true, refTable: 'color' },
    { id: 'article-genre', name: 'Id_Genre', type: 'INT', isFK: true, refTable: 'genre' },
    { id: 'article-type', name: 'Id_TypeArticle', type: 'INT', isFK: true, refTable: 'typearticle' },
    { id: 'article-client', name: 'Id_Client', type: 'INT', isFK: true, refTable: 'client' },
    { id: 'article-etat', name: 'Id_EtatArticle', type: 'INT', isFK: true, refTable: 'etatarticle' },
  ]},
  { id: 'marque', name: 'Marque', x: 40, y: 390, color: '#10b981', columns: [{ id: 'marque-id', name: 'ID', type: 'INT', isPK: true }, { id: 'marque-nom', name: 'Nom', type: 'VARCHAR(100)' }] },
  { id: 'color', name: 'Color', x: 300, y: 520, color: '#a855f7', columns: [{ id: 'color-id', name: 'ID', type: 'INT', isPK: true }, { id: 'color-nom', name: 'Nom', type: 'VARCHAR(50)' }] },
  { id: 'genre', name: 'Genre', x: 560, y: 110, color: '#ec4899', columns: [{ id: 'genre-id', name: 'ID', type: 'INT', isPK: true }, { id: 'genre-libelle', name: 'Libelle', type: 'VARCHAR(50)' }] },
  { id: 'client', name: 'Client', x: 820, y: 210, color: '#f59e0b', columns: [{ id: 'client-id', name: 'ID', type: 'INT', isPK: true }, { id: 'client-nom', name: 'Nom', type: 'VARCHAR(100)' }] },
  { id: 'typearticle', name: 'TypeArticle', x: 300, y: 35, color: '#6366f1', columns: [{ id: 'type-id', name: 'ID', type: 'INT', isPK: true }, { id: 'type-libelle', name: 'Libelle', type: 'VARCHAR(100)' }] },
  { id: 'etatarticle', name: 'EtatArticle', x: 40, y: 50, color: '#14b8a6', columns: [{ id: 'etat-id', name: 'ID', type: 'INT', isPK: true }, { id: 'etat-libelle', name: 'Libelle', type: 'VARCHAR(100)' }] },
  { id: 'articlesuivi', name: 'ArticleSuivi', x: 40, y: 210, color: '#06b6d4', columns: [{ id: 'suivi-id', name: 'ID', type: 'INT', isPK: true }, { id: 'suivi-article', name: 'Id_Article', type: 'INT', isFK: true, refTable: 'article' }, { id: 'suivi-status', name: 'Id_Status', type: 'INT', isFK: true, refTable: 'statusarticle' }, { id: 'suivi-user', name: 'Id_User', type: 'VARCHAR(450)', isFK: true, refTable: 'aspnetuser' }] },
  { id: 'statusarticle', name: 'StatusArticle', x: 40, y: 540, color: '#f43f5e', columns: [{ id: 'status-id', name: 'ID', type: 'INT', isPK: true }, { id: 'status-libelle', name: 'Libelle', type: 'VARCHAR(100)' }] },
  { id: 'articledocument', name: 'ArticleDocument', x: 560, y: 35, color: '#f97316', columns: [{ id: 'doc-id', name: 'ID', type: 'INT', isPK: true }, { id: 'doc-type', name: 'Type', type: 'VARCHAR(50)' }, { id: 'doc-article', name: 'Id_Article', type: 'INT', isFK: true, refTable: 'article' }] },
  { id: 'articlehistorique', name: 'ArticleHistorique', x: 820, y: 35, color: '#8b5cf6', columns: [{ id: 'hist-id', name: 'ID', type: 'INT', isPK: true }, { id: 'hist-article', name: 'Id_Article', type: 'INT', isFK: true, refTable: 'article' }] },
  { id: 'aspnetuser', name: 'AspNetUser', x: 820, y: 500, color: '#64748b', columns: [{ id: 'user-id', name: 'Id', type: 'VARCHAR(450)', isPK: true }, { id: 'user-name', name: 'UserName', type: 'VARCHAR(256)' }, { id: 'user-magasin', name: 'Id_Magasin', type: 'INT', isFK: true, refTable: 'magasin' }] },
  { id: 'magasin', name: 'Magasin', x: 820, y: 365, color: '#047857', columns: [{ id: 'magasin-id', name: 'ID', type: 'INT', isPK: true }, { id: 'magasin-nom', name: 'Nom', type: 'VARCHAR(150)' }] },
];

const cloneStarter = () => JSON.parse(JSON.stringify(starterTables));
const makeId = (value) => `${value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toSql(tables, enums) {
  const safe = (name) => `\`${String(name).replaceAll('`', '``')}\``;
  const sqlType = (type) => {
    if (type.startsWith('LIST:')) return 'JSON';
    if (!type.startsWith('ENUM:')) return type;
    const definition = enums.find((item) => item.id === type.slice(5));
    return definition ? `ENUM(${definition.values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', ')})` : 'VARCHAR(255)';
  };
  return tables.map((table) => {
    const definitions = table.columns.map((column) => `  ${safe(column.name)} ${sqlType(column.type)}${column.isPK ? ' PRIMARY KEY' : ''}`);
    table.columns.filter((column) => column.isFK && column.refTable).forEach((column) => {
      const target = tables.find((item) => item.id === column.refTable);
      const targetPk = target?.columns.find((item) => item.isPK)?.name || 'ID';
      if (target) definitions.push(`  FOREIGN KEY (${safe(column.name)}) REFERENCES ${safe(target.name)} (${safe(targetPk)})`);
    });
    return `CREATE TABLE ${safe(table.name)} (\n${definitions.join(',\n')}\n);`;
  }).join('\n\n');
}

export default function App() {
  const [tables, setTables] = useState(() => {
    try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return (Array.isArray(stored) ? stored : stored?.tables) || cloneStarter(); } catch { return cloneStarter(); }
  });
  const [enums, setEnums] = useState(() => {
    try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(stored) ? [] : stored?.enums || []; } catch { return []; }
  });
  const [selectedId, setSelectedId] = useState('article');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', type: 'VARCHAR(100)', isPK: false, isFK: false, refTable: '', sourceMultiplicity: '*', targetMultiplicity: '1' });
  const [newTableName, setNewTableName] = useState('');
  const [newEnumName, setNewEnumName] = useState('');
  const [newEnumValue, setNewEnumValue] = useState({});
  const [drag, setDrag] = useState(null);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [draggedTableId, setDraggedTableId] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [compactExplorer, setCompactExplorer] = useState(true);
  const [tablesExpanded, setTablesExpanded] = useState(true);
  const [enumsExpanded, setEnumsExpanded] = useState(true);
  const [expandedEnumId, setExpandedEnumId] = useState(null);
  const [viewport, setViewport] = useState({ x: 30, y: 30, zoom: 0.9 });
  const canvasRef = useRef(null);
  const importRef = useRef(null);
  const selected = tables.find((table) => table.id === selectedId) || tables[0];

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tables, enums })); }, [tables, enums]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 2400); return () => clearTimeout(timer); } }, [notice]);

  const visibleIds = useMemo(() => new Set(tables.filter((table) => table.name.toLowerCase().includes(search.toLowerCase()) || table.columns.some((column) => column.name.toLowerCase().includes(search.toLowerCase()))).map((table) => table.id)), [tables, search]);
  const relationCount = useMemo(() => tables.reduce((sum, table) => sum + table.columns.filter((column) => column.isFK && column.refTable).length, 0), [tables]);

  const updateTable = (id, recipe) => setTables((current) => current.map((table) => table.id === id ? recipe(table) : table));
  const selectTable = (id) => setSelectedId(id);

  const addTable = () => {
    const name = newTableName.trim();
    if (!name) return;
    const id = makeId(name);
    const next = { id, name, x: 80 + (tables.length % 4) * 240, y: 80 + (tables.length % 3) * 170, color: COLORS[tables.length % COLORS.length], columns: [{ id: makeId('id'), name: 'ID', type: 'INT', isPK: true }] };
    setTables((current) => [...current, next]);
    setSelectedId(id);
    setNewTableName('');
    setNotice(`Table « ${name} » créée`);
  };

  const deleteTable = () => {
    if (!selected || !window.confirm(`Supprimer la table « ${selected.name} » et ses relations ?`)) return;
    const remaining = tables.filter((table) => table.id !== selected.id).map((table) => ({ ...table, columns: table.columns.map((column) => column.refTable === selected.id ? { ...column, isFK: false, refTable: '' } : column) }));
    setTables(remaining);
    setSelectedId(remaining[0]?.id || '');
    setNotice('Table supprimée');
  };

  const addColumn = (event) => {
    event.preventDefault();
    if (!selected || !form.name.trim() || (form.isFK && !form.refTable)) return;
    updateTable(selected.id, (table) => ({ ...table, columns: [...table.columns, { ...form, id: makeId(form.name), name: form.name.trim(), refTable: form.isFK ? form.refTable : '' }] }));
    setForm({ name: '', type: 'VARCHAR(100)', isPK: false, isFK: false, refTable: '', sourceMultiplicity: '*', targetMultiplicity: '1' });
    setNotice('Champ ajouté');
  };

  const updateColumn = (columnId, values) => updateTable(selected.id, (table) => ({ ...table, columns: table.columns.map((column) => column.id === columnId ? { ...column, ...values } : column) }));
  const deleteColumn = (columnId) => updateTable(selected.id, (table) => ({ ...table, columns: table.columns.filter((column) => column.id !== columnId) }));
  const moveColumn = (targetId) => {
    if (!draggedColumnId || draggedColumnId === targetId) return;
    updateTable(selected.id, (table) => {
      const columns = [...table.columns];
      const from = columns.findIndex((column) => column.id === draggedColumnId);
      const to = columns.findIndex((column) => column.id === targetId);
      if (from < 0 || to < 0) return table;
      const [moved] = columns.splice(from, 1);
      columns.splice(to, 0, moved);
      return { ...table, columns };
    });
    setDraggedColumnId(null);
  };
  const moveTableInList = (targetId) => {
    if (!draggedTableId || draggedTableId === targetId) return;
    setTables((current) => {
      const ordered = [...current];
      const from = ordered.findIndex((table) => table.id === draggedTableId);
      const to = ordered.findIndex((table) => table.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = ordered.splice(from, 1);
      ordered.splice(to, 0, moved);
      return ordered;
    });
    setDraggedTableId(null);
  };
  const typeLabel = (type) => {
    if (type.startsWith('ENUM:')) return enums.find((item) => item.id === type.slice(5))?.name || 'Enum supprimé';
    if (type.startsWith('LIST:')) return `Liste<${type.slice(5)}>`;
    return type;
  };
  const addEnum = () => {
    const name = newEnumName.trim();
    if (!name) return;
    const id = makeId(name);
    setEnums((current) => [...current, { id, name, values: [] }]);
    setExpandedEnumId(id);
    setNewEnumName(''); setNotice(`Enum « ${name} » créé`);
  };
  const addEnumValue = (enumId) => {
    const value = (newEnumValue[enumId] || '').trim();
    if (!value) return;
    setEnums((current) => current.map((item) => item.id === enumId && !item.values.includes(value) ? { ...item, values: [...item.values, value] } : item));
    setNewEnumValue((current) => ({ ...current, [enumId]: '' }));
  };
  const deleteEnum = (enumId) => {
    const definition = enums.find((item) => item.id === enumId);
    if (!definition || !window.confirm(`Supprimer l’Enum « ${definition.name} » ? Les champs qui l’utilisent passeront en VARCHAR(255).`)) return;
    setEnums((current) => current.filter((item) => item.id !== enumId));
    setTables((current) => current.map((table) => ({ ...table, columns: table.columns.map((column) => column.type === `ENUM:${enumId}` ? { ...column, type: 'VARCHAR(255)' } : column) })));
  };

  const startDrag = (event, table) => {
    if (event.button !== 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const graphX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const graphY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
    setDrag({ kind: 'table', id: table.id, dx: graphX - table.x, dy: graphY - table.y });
    selectTable(table.id);
  };
  const startPan = (event) => {
    if (event.button !== 1 && event.target !== event.currentTarget) return;
    event.preventDefault();
    setDrag({ kind: 'pan', startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y });
  };
  const moveDrag = (event) => {
    if (!drag) return;
    if (drag.kind === 'pan') {
      setViewport((current) => ({ ...current, x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY }));
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(8, (event.clientX - rect.left - viewport.x) / viewport.zoom - drag.dx);
    const y = Math.max(8, (event.clientY - rect.top - viewport.y) / viewport.zoom - drag.dy);
    updateTable(drag.id, (table) => ({ ...table, x, y }));
  };
  const zoomAt = (nextZoom, clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const zoom = Math.min(1.8, Math.max(0.35, nextZoom));
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;
    setViewport((current) => {
      const graphX = (cursorX - current.x) / current.zoom;
      const graphY = (cursorY - current.y) / current.zoom;
      return { zoom, x: cursorX - graphX * zoom, y: cursorY - graphY * zoom };
    });
  };
  const handleWheel = (event) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      zoomAt(viewport.zoom * (event.deltaY > 0 ? 0.9 : 1.1), event.clientX, event.clientY);
      return;
    }
    setViewport((current) => ({
      ...current,
      x: current.x - (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX),
      y: current.y - (event.shiftKey ? 0 : event.deltaY),
    }));
  };
  const zoomFromCenter = (factor) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) zoomAt(viewport.zoom * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  const fitGraph = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !tables.length) return;
    const minX = Math.min(...tables.map((table) => table.x));
    const minY = Math.min(...tables.map((table) => table.y));
    const maxX = Math.max(...tables.map((table) => table.x + cardSize(table).width));
    const maxY = Math.max(...tables.map((table) => table.y + cardSize(table).height));
    const zoom = Math.min(1.2, Math.max(0.35, (rect.width - 80) / (maxX - minX), (rect.height - 80) / (maxY - minY)));
    setViewport({ zoom, x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom });
  };

  const importSchema = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const importedTables = Array.isArray(parsed) ? parsed : parsed.tables;
        const importedEnums = Array.isArray(parsed) ? [] : parsed.enums || [];
        if (!Array.isArray(importedTables) || importedTables.some((table) => !table.id || !table.name || !Array.isArray(table.columns))) throw new Error();
        setTables(importedTables); setEnums(importedEnums); setSelectedId(importedTables[0]?.id || ''); setNotice('Schéma importé');
      } catch { window.alert('Ce fichier JSON ne contient pas un schéma valide.'); }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (!window.confirm('Restaurer le schéma initial ? Vos modifications locales seront remplacées.')) return;
    const initial = cloneStarter(); setTables(initial); setEnums([]); setSelectedId('article'); setNotice('Schéma restauré');
  };

  const cardSize = (table) => ({ width: 210, height: 45 + table.columns.length * 29 });
  const relations = [];
  tables.forEach((source) => source.columns.forEach((column) => {
    if (!column.isFK || !column.refTable) return;
    const target = tables.find((table) => table.id === column.refTable);
    if (!target) return;
    const a = cardSize(source); const b = cardSize(target);
    const x1 = source.x + a.width / 2; const y1 = source.y + a.height / 2;
    const x2 = target.x + b.width / 2; const y2 = target.y + b.height / 2;
    const labelX1 = x1 + (x2 - x1) * 0.12;
    const labelY1 = y1 + (y2 - y1) * 0.12 - 7;
    const labelX2 = x1 + (x2 - x1) * 0.88;
    const labelY2 = y1 + (y2 - y1) * 0.88 - 7;
    relations.push(<g key={`${source.id}-${column.id}`} style={{ '--line': source.color }}>
      <path d={`M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`} className="relation" />
      <text x={labelX1} y={labelY1} className="multiplicity">{column.sourceMultiplicity || '*'}</text>
      <text x={labelX2} y={labelY2} className="multiplicity">{column.targetMultiplicity || '1'}</text>
    </g>);
  }));

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">R</span><div><h1>ReLife Data Studio</h1><p>Éditeur graphique de structure de données</p></div></div>
      <div className="header-actions">
        <button className="button secondary" onClick={() => importRef.current.click()}>Importer JSON</button>
        <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importSchema} />
        <button className="button secondary" onClick={() => download('schema-relife.json', JSON.stringify({ version: 2, tables, enums }, null, 2), 'application/json')}>Exporter JSON</button>
        <button className="button primary" onClick={() => download('schema-relife.sql', toSql(tables, enums), 'text/sql')}>Exporter SQL</button>
      </div>
    </header>

    <section className="stats">
      <span><b>{tables.length}</b> tables</span><span><b>{tables.reduce((sum, table) => sum + table.columns.length, 0)}</b> champs</span><span><b>{relationCount}</b> relations</span><span><b>{enums.length}</b> Enums</span><span className="saved">● Sauvegarde automatique</span>
    </section>

    <div className={`workspace ${leftOpen ? '' : 'left-closed'} ${rightOpen ? '' : 'right-closed'}`}>
      {leftOpen && <aside className={`sidebar ${compactExplorer ? 'compact' : ''}`} onWheel={(event) => event.stopPropagation()}>
        <div className="sidebar-head"><div><span className="eyebrow">Explorateur</span><h2>Structure</h2></div><div className="sidebar-actions"><button className={`icon-button ${compactExplorer ? 'active' : ''}`} title="Affichage compact" onClick={() => setCompactExplorer((value) => !value)}>≡</button><button className="icon-button" title="Réinitialiser" onClick={reset}>↻</button></div></div>
        <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une table ou un champ…" />
        <button className="explorer-section-toggle" onClick={() => setTablesExpanded((value) => !value)}><span>{tablesExpanded ? '▾' : '▸'} Tables</span><small>{tables.length}</small></button>
        {tablesExpanded && <><div className="table-list">
          {tables.filter((table) => visibleIds.has(table.id)).map((table) => <div key={table.id} role="button" tabIndex="0" className={`table-list-item ${selected?.id === table.id ? 'active' : ''} ${draggedTableId === table.id ? 'being-dragged' : ''}`} onClick={() => selectTable(table.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectTable(table.id); }} onDragOver={(e) => e.preventDefault()} onDrop={() => moveTableInList(table.id)}>
            <span className="table-grip" draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedTableId(table.id); }} onDragEnd={() => setDraggedTableId(null)} title="Glisser pour réordonner la table">⠿</span><span className="color-dot" style={{ background: table.color }} /><span className="table-list-name">{table.name}</span><small>{table.columns.length}</small>
          </div>)}
        </div>
        <div className="new-table"><input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTable()} placeholder="Nouvelle table" /><button onClick={addTable}>+</button></div></>}
        <div className="enum-section">
          <button className="explorer-section-toggle" onClick={() => setEnumsExpanded((value) => !value)}><span>{enumsExpanded ? '▾' : '▸'} Énumérations</span><small>{enums.length}</small></button>
          {enumsExpanded && <><div className="quick-create"><input value={newEnumName} onChange={(e) => setNewEnumName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEnum()} placeholder="Créer rapidement un Enum" /><button onClick={addEnum}>+ Créer</button></div>
          {enums.map((definition) => <div className={`enum-card ${expandedEnumId === definition.id ? 'expanded' : ''}`} key={definition.id}>
            <div className="enum-head"><button className="enum-toggle" onClick={() => setExpandedEnumId((current) => current === definition.id ? null : definition.id)}>{expandedEnumId === definition.id ? '▾' : '▸'}</button><input value={definition.name} onChange={(e) => setEnums((current) => current.map((item) => item.id === definition.id ? { ...item, name: e.target.value } : item))} /><small>{definition.values.length}</small><button title="Supprimer cet Enum" onClick={() => deleteEnum(definition.id)}>×</button></div>
            {expandedEnumId === definition.id && <><div className="enum-values">{definition.values.map((value) => <span key={value}>{value}<button onClick={() => setEnums((current) => current.map((item) => item.id === definition.id ? { ...item, values: item.values.filter((entry) => entry !== value) } : item))}>×</button></span>)}</div>
            <div className="enum-add"><input value={newEnumValue[definition.id] || ''} onChange={(e) => setNewEnumValue((current) => ({ ...current, [definition.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEnumValue(definition.id); } }} placeholder="Ajouter une valeur" /><button onClick={() => addEnumValue(definition.id)}>+</button></div></>}
          </div>)}</>}
        </div>
      </aside>}

      <section className="canvas-panel">
        <div className="canvas-toolbar"><div className="toolbar-navigation"><button className={leftOpen ? 'active' : ''} title="Afficher ou masquer l’explorateur" onClick={() => setLeftOpen((value) => !value)}>☰ Tables</button><div><strong>Diagramme relationnel</strong><span>Molette : défiler · Maj + molette : horizontal · Ctrl + molette : zoomer</span></div></div><div className="view-controls"><button title="Dézoomer" onClick={() => zoomFromCenter(0.85)}>−</button><output>{Math.round(viewport.zoom * 100)}%</output><button title="Zoomer" onClick={() => zoomFromCenter(1.15)}>+</button><button className="fit-button" title="Afficher tout le graphe" onClick={fitGraph}>Centrer</button><button className={`fit-button ${rightOpen ? 'active' : ''}`} title="Afficher ou masquer les propriétés" onClick={() => setRightOpen((value) => !value)}>Propriétés ☷</button></div></div>
        <div ref={canvasRef} className={`canvas ${drag?.kind === 'pan' ? 'panning' : drag ? 'dragging' : ''}`} onMouseDown={startPan} onMouseMove={moveDrag} onMouseUp={() => setDrag(null)} onMouseLeave={() => setDrag(null)} onWheel={handleWheel} style={{ backgroundSize: `${18 * viewport.zoom}px ${18 * viewport.zoom}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}>
          <div className="canvas-space" onMouseDown={startPan} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
            <svg className="relations" width="1400" height="900">{relations}</svg>
            {tables.map((table) => <article key={table.id} onClick={() => selectTable(table.id)} className={`table-card ${selected?.id === table.id ? 'selected' : ''} ${visibleIds.has(table.id) ? '' : 'dimmed'}`} style={{ left: table.x, top: table.y, '--accent': table.color }}>
              <header onMouseDown={(event) => startDrag(event, table)}><span className="drag-grip">⠿</span><strong>{table.name}</strong><span>{table.columns.length}</span></header>
              <div>{table.columns.map((column) => <div className="column-row" key={column.id}><span className={`key-badge ${column.isPK ? 'pk' : column.isFK ? 'fk' : ''}`}>{column.isPK ? 'PK' : column.isFK ? 'FK' : '·'}</span><b>{column.name}</b><code>{typeLabel(column.type)}</code></div>)}</div>
            </article>)}
          </div>
        </div>
      </section>

      {rightOpen && <aside className="inspector">
        {selected ? <>
          <div className="inspector-title"><div><span className="eyebrow">Propriétés</span><h2>{selected.name}</h2></div><button className="danger-icon" title="Supprimer la table" onClick={deleteTable}>×</button></div>
          <label className="field-label">Nom de la table<input value={selected.name} onChange={(e) => updateTable(selected.id, (table) => ({ ...table, name: e.target.value }))} /></label>
          <label className="field-label">Couleur<input className="color-input" type="color" value={selected.color} onChange={(e) => updateTable(selected.id, (table) => ({ ...table, color: e.target.value }))} /></label>
          <div className="section-title"><span>Champs</span><small>{selected.columns.length}</small></div>
          <div className="column-editor">{selected.columns.map((column) => <div className={`column-edit ${draggedColumnId === column.id ? 'being-dragged' : ''}`} key={column.id} onDragOver={(e) => e.preventDefault()} onDrop={() => moveColumn(column.id)}>
            <div className="column-edit-head"><span className="column-grip" draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedColumnId(column.id); }} onDragEnd={() => setDraggedColumnId(null)} title="Glisser pour déplacer le champ">⠿</span><input value={column.name} onChange={(e) => updateColumn(column.id, { name: e.target.value })} /><button title="Supprimer le champ" onClick={() => deleteColumn(column.id)}>×</button></div>
            <select value={column.type} onChange={(e) => updateColumn(column.id, { type: e.target.value })}><optgroup label="Types standards">{[...new Set([...TYPES, ...(!column.type.startsWith('ENUM:') && !column.type.startsWith('LIST:') ? [column.type] : [])])].map((type) => <option key={type}>{type}</option>)}</optgroup><optgroup label="Listes">{LIST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</optgroup>{enums.length > 0 && <optgroup label="Énumérations">{enums.map((definition) => <option key={definition.id} value={`ENUM:${definition.id}`}>Enum · {definition.name}</option>)}</optgroup>}</select>
            <div className="checks"><label><input type="checkbox" checked={!!column.isPK} onChange={(e) => updateColumn(column.id, { isPK: e.target.checked, isFK: e.target.checked ? false : column.isFK })} /> PK</label><label><input type="checkbox" checked={!!column.isFK} onChange={(e) => updateColumn(column.id, { isFK: e.target.checked, isPK: e.target.checked ? false : column.isPK, refTable: e.target.checked ? column.refTable : '' })} /> FK</label></div>
            {column.isFK && <div className="relation-settings">
              <select value={column.refTable || ''} onChange={(e) => updateColumn(column.id, { refTable: e.target.value })}><option value="">Table liée…</option>{tables.filter((table) => table.id !== selected.id).map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
              <div className="multiplicity-grid"><label>Cette table<select value={column.sourceMultiplicity || '*'} onChange={(e) => updateColumn(column.id, { sourceMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label><span>→</span><label>Table cible<select value={column.targetMultiplicity || '1'} onChange={(e) => updateColumn(column.id, { targetMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label></div>
            </div>}
          </div>)}</div>
          <form className="add-column" onSubmit={addColumn}><span className="section-title">Ajouter un champ</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du champ" /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><optgroup label="Types standards">{TYPES.map((type) => <option key={type}>{type}</option>)}</optgroup><optgroup label="Listes">{LIST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</optgroup>{enums.length > 0 && <optgroup label="Énumérations">{enums.map((definition) => <option key={definition.id} value={`ENUM:${definition.id}`}>Enum · {definition.name}</option>)}</optgroup>}</select><div className="checks"><label><input type="checkbox" checked={form.isPK} onChange={(e) => setForm({ ...form, isPK: e.target.checked, isFK: e.target.checked ? false : form.isFK })} /> Clé primaire</label><label><input type="checkbox" checked={form.isFK} onChange={(e) => setForm({ ...form, isFK: e.target.checked, isPK: e.target.checked ? false : form.isPK })} /> Clé étrangère</label></div>{form.isFK && <div className="relation-settings"><select required value={form.refTable} onChange={(e) => setForm({ ...form, refTable: e.target.value })}><option value="">Choisir la table liée</option>{tables.filter((table) => table.id !== selected.id).map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select><div className="multiplicity-grid"><label>Cette table<select value={form.sourceMultiplicity} onChange={(e) => setForm({ ...form, sourceMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label><span>→</span><label>Table cible<select value={form.targetMultiplicity} onChange={(e) => setForm({ ...form, targetMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label></div></div>}<button className="button primary" type="submit">+ Ajouter le champ</button></form>
        </> : <p>Aucune table. Créez-en une depuis le panneau de gauche.</p>}
      </aside>}
    </div>
    {notice && <div className="toast">✓ {notice}</div>}
  </main>;
}
