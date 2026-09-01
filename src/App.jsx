import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { buildEntityFrameworkFiles, writeEntityFrameworkFolder } from './entityFrameworkExport.js';

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
    const definitions = table.columns.map((column) => `  ${safe(column.name)} ${sqlType(column.type)}${column.isNullable && !column.isPK ? ' NULL' : ' NOT NULL'}${column.isPK ? ' PRIMARY KEY' : ''}`);
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
  const [form, setForm] = useState({ name: '', type: 'VARCHAR(100)', isPK: false, isFK: false, isNullable: false, refTable: '', sourceMultiplicity: '*', targetMultiplicity: '1' });
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
  const [inlineEdit, setInlineEdit] = useState(null);
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
    setForm({ name: '', type: 'VARCHAR(100)', isPK: false, isFK: false, isNullable: false, refTable: '', sourceMultiplicity: '*', targetMultiplicity: '1' });
    setNotice('Champ ajouté');
  };

  const updateColumn = (columnId, values) => updateTable(selected.id, (table) => ({ ...table, columns: table.columns.map((column) => column.id === columnId ? { ...column, ...values } : column) }));
  const updateColumnInTable = (tableId, columnId, values) => updateTable(tableId, (table) => ({ ...table, columns: table.columns.map((column) => column.id === columnId ? { ...column, ...values } : column) }));
  const deleteColumn = (columnId) => updateTable(selected.id, (table) => ({ ...table, columns: table.columns.filter((column) => column.id !== columnId) }));
  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const value = inlineEdit.value.trim();
    if (value && inlineEdit.kind === 'column') updateColumnInTable(inlineEdit.tableId, inlineEdit.columnId, { name: value });
    if (value && inlineEdit.kind === 'enum') {
      setEnums((current) => current.map((item) => item.id === inlineEdit.enumId
        ? { ...item, values: item.values.map((entry, index) => index === inlineEdit.valueIndex ? value : entry) }
        : item));
    }
    setInlineEdit(null);
  };
  const handleInlineKey = (event) => {
    if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
    if (event.key === 'Escape') { event.preventDefault(); setInlineEdit(null); }
  };
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
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const graphX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const graphY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
    setDrag({ kind: 'table', id: table.id, dx: graphX - table.x, dy: graphY - table.y });
    selectTable(table.id);
  };
  const startPan = (event) => {
    if (event.button !== 1 && event.target !== event.currentTarget) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
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
  const finishDrag = (event) => {
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDrag(null);
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

  const exportEntityFramework = async () => {
    const files = buildEntityFrameworkFiles(tables, enums);
    try {
      if (await writeEntityFrameworkFolder(files)) {
        setNotice('Dossier ReLifeShared créé');
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    const zip = new JSZip();
    Object.entries(files).forEach(([path, content]) => zip.file(`ReLifeShared/${path}`, content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'ReLifeShared.zip'; anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Export Entity Framework téléchargé');
  };

  const cardSize = (table) => ({ width: 210, height: 37 + table.columns.length * 29 });
  const cardCenter = (table) => {
    const size = cardSize(table);
    return { x: table.x + size.width / 2, y: table.y + size.height / 2 };
  };
  const pointOnTableEdge = (table, toward) => {
    const size = cardSize(table);
    const center = cardCenter(table);
    const dx = toward.x - center.x;
    const dy = toward.y - center.y;
    if (dx === 0 && dy === 0) return { x: center.x + size.width / 2, y: center.y };
    const xScale = dx === 0 ? Number.POSITIVE_INFINITY : (size.width / 2) / Math.abs(dx);
    const yScale = dy === 0 ? Number.POSITIVE_INFINITY : (size.height / 2) / Math.abs(dy);
    const scale = Math.min(xScale, yScale);
    return { x: center.x + dx * scale, y: center.y + dy * scale };
  };
  const shiftAlongTableEdge = (table, point, offset) => {
    if (!offset) return point;
    const size = cardSize(table);
    const distances = {
      left: Math.abs(point.x - table.x),
      right: Math.abs(point.x - (table.x + size.width)),
      top: Math.abs(point.y - table.y),
      bottom: Math.abs(point.y - (table.y + size.height)),
    };
    const edge = Object.entries(distances).sort((a, b) => a[1] - b[1])[0][0];
    if (edge === 'left' || edge === 'right') {
      return { x: point.x, y: Math.max(table.y + 9, Math.min(table.y + size.height - 9, point.y + offset)) };
    }
    return { x: Math.max(table.x + 9, Math.min(table.x + size.width - 9, point.x + offset)), y: point.y };
  };
  const relationEntries = [];
  tables.forEach((source) => source.columns.forEach((column) => {
    if (!column.isFK || !column.refTable) return;
    const target = tables.find((table) => table.id === column.refTable);
    if (!target) return;
    relationEntries.push({ source, target, column });
  }));
  const relationGroups = new Map();
  relationEntries.forEach((entry) => {
    const key = [entry.source.id, entry.target.id].sort().join('::');
    relationGroups.set(key, [...(relationGroups.get(key) || []), entry]);
  });
  const relationGeometry = relationEntries.map((entry) => {
    const { source, target, column } = entry;
    const groupKey = [source.id, target.id].sort().join('::');
    const siblings = relationGroups.get(groupKey);
    const siblingIndex = siblings.indexOf(entry);
    const parallelOffset = (siblingIndex - (siblings.length - 1) / 2) * 28;
    const sourceCenter = cardCenter(source);
    const targetCenter = cardCenter(target);
    const start = shiftAlongTableEdge(source, pointOnTableEdge(source, targetCenter), parallelOffset);
    const end = shiftAlongTableEdge(target, pointOnTableEdge(target, sourceCenter), parallelOffset);
    const distance = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const unitX = (end.x - start.x) / distance;
    const unitY = (end.y - start.y) / distance;
    const perpendicularX = -unitY;
    const perpendicularY = unitX;
    const labelX1 = start.x + unitX * 18 + perpendicularX * 10;
    const labelY1 = start.y + unitY * 18 + perpendicularY * 10;
    const labelX2 = end.x - unitX * 18 + perpendicularX * 10;
    const labelY2 = end.y - unitY * 18 + perpendicularY * 10;
    const controlX = (start.x + end.x) / 2;
    return { source, column, start, end, controlX, labelX1, labelY1, labelX2, labelY2 };
  });
  const relations = relationGeometry.map(({ source, column, start, end, controlX, labelX1, labelY1, labelX2, labelY2 }) => <g key={`${source.id}-${column.id}`} style={{ '--line': source.color }}>
    <path d={`M${start.x},${start.y} C${controlX},${start.y} ${controlX},${end.y} ${end.x},${end.y}`} className="relation" />
    <circle cx={start.x} cy={start.y} r="3" className="relation-endpoint" />
    <circle cx={end.x} cy={end.y} r="3" className="relation-endpoint" />
    <text x={labelX1} y={labelY1} className="multiplicity">{column.sourceMultiplicity || '*'}</text>
    <text x={labelX2} y={labelY2} className="multiplicity">{column.targetMultiplicity || '1'}</text>
  </g>);

  const exportSvg = () => {
    const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    const padding = 60;
    const minX = (tables.length ? Math.min(...tables.map((table) => table.x)) : 0) - padding;
    const minY = (tables.length ? Math.min(...tables.map((table) => table.y)) : 0) - padding;
    const maxX = (tables.length ? Math.max(...tables.map((table) => table.x + cardSize(table).width)) : 800) + padding;
    const maxY = (tables.length ? Math.max(...tables.map((table) => table.y + cardSize(table).height)) : 600) + padding;
    const width = maxX - minX;
    const height = maxY - minY;
    const paths = relationGeometry.map(({ source, start, end, controlX }) => `<path d="M${start.x},${start.y} C${controlX},${start.y} ${controlX},${end.y} ${end.x},${end.y}" fill="none" stroke="${source.color}" stroke-width="2" stroke-dasharray="6 5" opacity="0.8"/><circle cx="${start.x}" cy="${start.y}" r="3.5" fill="${source.color}"/><circle cx="${end.x}" cy="${end.y}" r="3.5" fill="${source.color}"/>`).join('');
    const cards = tables.map((table) => {
      const size = cardSize(table);
      const rows = table.columns.map((column, index) => {
        const top = table.y + 37 + index * 29;
        const key = column.isPK ? 'PK' : column.isFK ? 'FK' : '·';
        const keyColor = column.isPK ? '#ffcb51' : column.isFK ? '#50c8e9' : '#405873';
        const type = `${typeLabel(column.type)}${column.isNullable && !column.isPK ? ' · NULL' : ''}`;
        return `<line x1="${table.x}" y1="${top}" x2="${table.x + size.width}" y2="${top}" stroke="#132338"/><text x="${table.x + 10}" y="${top + 19}" fill="${keyColor}" font-size="8" font-weight="700">${key}</text><text x="${table.x + 36}" y="${top + 19}" fill="#d4dfec" font-size="10" font-weight="600">${escapeXml(column.name)}</text><text x="${table.x + size.width - 8}" y="${top + 19}" fill="#7890ad" font-size="8" text-anchor="end">${escapeXml(type)}</text>`;
      }).join('');
      return `<g><rect x="${table.x}" y="${table.y}" width="${size.width}" height="${size.height}" rx="8" fill="#081321" stroke="${table.color}" stroke-width="1.5"/><path d="M${table.x + 8},${table.y} H${table.x + size.width - 8} Q${table.x + size.width},${table.y} ${table.x + size.width},${table.y + 8} V${table.y + 37} H${table.x} V${table.y + 8} Q${table.x},${table.y} ${table.x + 8},${table.y}" fill="${table.color}"/><text x="${table.x + 12}" y="${table.y + 24}" fill="#ffffff" font-size="12" font-weight="700">${escapeXml(table.name)}</text>${rows}</g>`;
    }).join('');
    const labels = relationGeometry.map(({ source, column, labelX1, labelY1, labelX2, labelY2 }) => `<g fill="#ffffff" stroke="#081321" stroke-width="5" paint-order="stroke fill" font-size="13" font-weight="800" text-anchor="middle" dominant-baseline="middle"><text x="${labelX1}" y="${labelY1}">${escapeXml(column.sourceMultiplicity || '*')}</text><text x="${labelX2}" y="${labelY2}">${escapeXml(column.targetMultiplicity || '1')}</text></g>`).join('');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#081321"/>${paths}${cards}${labels}</svg>`;
    download('schema-relife.svg', svg, 'image/svg+xml;charset=utf-8');
    setNotice('Diagramme SVG exporté');
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">R</span><div><h1>ReLife Data Studio</h1><p>Éditeur graphique de structure de données</p></div></div>
      <div className="header-actions">
        <button className="button secondary" onClick={() => importRef.current.click()}>Importer JSON</button>
        <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importSchema} />
        <button className="button secondary" onClick={() => download('schema-relife.json', JSON.stringify({ version: 2, tables, enums }, null, 2), 'application/json')}>Exporter JSON</button>
        <button className="button secondary" onClick={exportSvg}>Exporter SVG</button>
        <button className="button primary" onClick={() => download('schema-relife.sql', toSql(tables, enums), 'text/sql')}>Exporter SQL</button>
        <button className="button ef-button" onClick={exportEntityFramework}>Exporter Entity Framework</button>
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
            {expandedEnumId === definition.id && <><div className="enum-values">{definition.values.map((value, valueIndex) => inlineEdit?.kind === 'enum' && inlineEdit.enumId === definition.id && inlineEdit.valueIndex === valueIndex
              ? <input key={`${definition.id}-${valueIndex}`} className="enum-inline-input" autoFocus value={inlineEdit.value} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })} onBlur={commitInlineEdit} onKeyDown={handleInlineKey} />
              : <span key={`${value}-${valueIndex}`} className="editable-enum-value" title="Cliquer pour renommer" onClick={() => setInlineEdit({ kind: 'enum', enumId: definition.id, valueIndex, value })}>{value}<button onClick={(event) => { event.stopPropagation(); setEnums((current) => current.map((item) => item.id === definition.id ? { ...item, values: item.values.filter((_, index) => index !== valueIndex) } : item)); }}>×</button></span>)}</div>
            <div className="enum-add"><input value={newEnumValue[definition.id] || ''} onChange={(e) => setNewEnumValue((current) => ({ ...current, [definition.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEnumValue(definition.id); } }} placeholder="Ajouter une valeur" /><button onClick={() => addEnumValue(definition.id)}>+</button></div></>}
          </div>)}</>}
        </div>
      </aside>}

      <section className="canvas-panel">
        <div className="canvas-toolbar"><div className="toolbar-navigation"><button className={leftOpen ? 'active' : ''} title="Afficher ou masquer l’explorateur" onClick={() => setLeftOpen((value) => !value)}>☰ Tables</button><div><strong>Diagramme relationnel</strong><span>Glisser avec un doigt ou la souris · Ctrl + molette : zoomer</span></div></div><div className="view-controls"><button title="Dézoomer" onClick={() => zoomFromCenter(0.85)}>−</button><output>{Math.round(viewport.zoom * 100)}%</output><button title="Zoomer" onClick={() => zoomFromCenter(1.15)}>+</button><button className="fit-button" title="Afficher tout le graphe" onClick={fitGraph}>Centrer</button><button className={`fit-button ${rightOpen ? 'active' : ''}`} title="Afficher ou masquer les propriétés" onClick={() => setRightOpen((value) => !value)}>Propriétés ☷</button></div></div>
        <div ref={canvasRef} className={`canvas ${drag?.kind === 'pan' ? 'panning' : drag ? 'dragging' : ''}`} onPointerDown={startPan} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onWheel={handleWheel} style={{ backgroundSize: `${18 * viewport.zoom}px ${18 * viewport.zoom}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}>
          <div className="canvas-space" onPointerDown={startPan} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
            <svg className="relations" width="1400" height="900">{relations}</svg>
            {tables.map((table) => <article key={table.id} onClick={() => selectTable(table.id)} className={`table-card ${selected?.id === table.id ? 'selected' : ''} ${visibleIds.has(table.id) ? '' : 'dimmed'}`} style={{ left: table.x, top: table.y, '--accent': table.color }}>
              <header onPointerDown={(event) => startDrag(event, table)}><span className="drag-grip">⠿</span><strong>{table.name}</strong><span>{table.columns.length}</span></header>
              <div>{table.columns.map((column) => <div className="column-row" key={column.id}><span className={`key-badge ${column.isPK ? 'pk' : column.isFK ? 'fk' : ''}`}>{column.isPK ? 'PK' : column.isFK ? 'FK' : '·'}</span>{inlineEdit?.kind === 'column' && inlineEdit.tableId === table.id && inlineEdit.columnId === column.id
                ? <input className="column-inline-input" autoFocus value={inlineEdit.value} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })} onBlur={commitInlineEdit} onKeyDown={handleInlineKey} />
                : <b className="editable-column-name" title="Cliquer pour renommer" onClick={(event) => { event.stopPropagation(); selectTable(table.id); setInlineEdit({ kind: 'column', tableId: table.id, columnId: column.id, value: column.name }); }}>{column.name}</b>}<code>{typeLabel(column.type)}{column.isNullable && !column.isPK ? ' · NULL' : ''}</code></div>)}</div>
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
            <div className="checks"><label><input type="checkbox" checked={!!column.isPK} onChange={(e) => updateColumn(column.id, { isPK: e.target.checked, isFK: e.target.checked ? false : column.isFK, isNullable: e.target.checked ? false : column.isNullable })} /> PK</label><label><input type="checkbox" checked={!!column.isFK} onChange={(e) => updateColumn(column.id, { isFK: e.target.checked, isPK: e.target.checked ? false : column.isPK, refTable: e.target.checked ? column.refTable : '' })} /> FK</label><label title={column.isPK ? 'Une clé primaire ne peut pas être nullable' : ''}><input type="checkbox" disabled={!!column.isPK} checked={!!column.isNullable && !column.isPK} onChange={(e) => updateColumn(column.id, { isNullable: e.target.checked })} /> Nullable</label></div>
            {column.isFK && <div className="relation-settings">
              <select value={column.refTable || ''} onChange={(e) => updateColumn(column.id, { refTable: e.target.value })}><option value="">Table liée…</option>{tables.filter((table) => table.id !== selected.id).map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
              <div className="multiplicity-grid"><label>Cette table<select value={column.sourceMultiplicity || '*'} onChange={(e) => updateColumn(column.id, { sourceMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label><span>→</span><label>Table cible<select value={column.targetMultiplicity || '1'} onChange={(e) => updateColumn(column.id, { targetMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label></div>
            </div>}
          </div>)}</div>
          <form className="add-column" onSubmit={addColumn}><span className="section-title">Ajouter un champ</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du champ" /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><optgroup label="Types standards">{TYPES.map((type) => <option key={type}>{type}</option>)}</optgroup><optgroup label="Listes">{LIST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</optgroup>{enums.length > 0 && <optgroup label="Énumérations">{enums.map((definition) => <option key={definition.id} value={`ENUM:${definition.id}`}>Enum · {definition.name}</option>)}</optgroup>}</select><div className="checks"><label><input type="checkbox" checked={form.isPK} onChange={(e) => setForm({ ...form, isPK: e.target.checked, isFK: e.target.checked ? false : form.isFK, isNullable: e.target.checked ? false : form.isNullable })} /> Clé primaire</label><label><input type="checkbox" checked={form.isFK} onChange={(e) => setForm({ ...form, isFK: e.target.checked, isPK: e.target.checked ? false : form.isPK })} /> Clé étrangère</label><label title={form.isPK ? 'Une clé primaire ne peut pas être nullable' : ''}><input type="checkbox" disabled={form.isPK} checked={form.isNullable && !form.isPK} onChange={(e) => setForm({ ...form, isNullable: e.target.checked })} /> Nullable</label></div>{form.isFK && <div className="relation-settings"><select required value={form.refTable} onChange={(e) => setForm({ ...form, refTable: e.target.value })}><option value="">Choisir la table liée</option>{tables.filter((table) => table.id !== selected.id).map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select><div className="multiplicity-grid"><label>Cette table<select value={form.sourceMultiplicity} onChange={(e) => setForm({ ...form, sourceMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label><span>→</span><label>Table cible<select value={form.targetMultiplicity} onChange={(e) => setForm({ ...form, targetMultiplicity: e.target.value })}>{MULTIPLICITIES.map((value) => <option key={value}>{value}</option>)}</select></label></div></div>}<button className="button primary" type="submit">+ Ajouter le champ</button></form>
        </> : <p>Aucune table. Créez-en une depuis le panneau de gauche.</p>}
      </aside>}
    </div>
    {notice && <div className="toast">✓ {notice}</div>}
  </main>;
}
