import React, { useState, useRef } from 'react';
import { Database, Key, Link2, Plus, Trash2, RefreshCw, Move } from 'lucide-react';

// Positionnement initial resserré pour s'assurer que tout rentre à l'écran
const initialTables = [
  {
    id: "article",
    name: "Article",
    x: 240,
    y: 160,
    color: "#3b82f6",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Taille", type: "VARCHAR(10)" },
      { name: "Reference", type: "VARCHAR(50)" },
      { name: "PrixReprise", type: "DECIMAL(10,2)" },
      { name: "Id_Marque", type: "INT", isPK: false, isFK: true, refTable: "marque" },
      { name: "Id_Color", type: "INT", isPK: false, isFK: true, refTable: "color" },
      { name: "Id_Genre", type: "INT", isPK: false, isFK: true, refTable: "genre" },
      { name: "Id_TypeArticle", type: "INT", isPK: false, isFK: true, refTable: "typearticle" },
      { name: "Id_Client", type: "INT", isPK: false, isFK: true, refTable: "client" },
      { name: "Id_EtatArticle", type: "INT", isPK: false, isFK: true, refTable: "etatarticle" }
    ]
  },
  {
    id: "marque",
    name: "Marque",
    x: 20,
    y: 350,
    color: "#10b981",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Nom", type: "VARCHAR(100)" }
    ]
  },
  {
    id: "color",
    name: "Color",
    x: 240,
    y: 480,
    color: "#a855f7",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Nom", type: "VARCHAR(50)" }
    ]
  },
  {
    id: "genre",
    name: "Genre",
    x: 480,
    y: 100,
    color: "#ec4899",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Libelle", type: "VARCHAR(50)" }
    ]
  },
  {
    id: "client",
    name: "Client",
    x: 700,
    y: 180,
    color: "#f59e0b",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Nom", type: "VARCHAR(100)" }
    ]
  },
  {
    id: "typearticle",
    name: "TypeArticle",
    x: 240,
    y: 20,
    color: "#6366f1",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Libelle", type: "VARCHAR(100)" }
    ]
  },
  {
    id: "etatarticle",
    name: "EtatArticle",
    x: 20,
    y: 50,
    color: "#14b8a6",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Libelle", type: "VARCHAR(100)" }
    ]
  },
  {
    id: "articlesuivi",
    name: "ArticleSuivi",
    x: 20,
    y: 180,
    color: "#06b6d4",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Id_Article", type: "INT", isPK: false, isFK: true, refTable: "article" },
      { name: "Id_Status", type: "INT", isPK: false, isFK: true, refTable: "statusarticle" },
      { name: "Id_User", type: "VARCHAR(450)", isPK: false, isFK: true, refTable: "aspnetuser" }
    ]
  },
  {
    id: "statusarticle",
    name: "StatusArticle",
    x: 20,
    y: 480,
    color: "#f43f5e",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Libelle", type: "VARCHAR(100)" }
    ]
  },
  {
    id: "articledocument",
    name: "ArticleDoc",
    x: 480,
    y: 20,
    color: "#f97316",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Type", type: "VARCHAR(50)" },
      { name: "Id_Article", type: "INT", isPK: false, isFK: true, refTable: "article" }
    ]
  },
  {
    id: "articlehistorique",
    name: "ArticleHist",
    x: 700,
    y: 20,
    color: "#8b5cf6",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Id_Article", type: "INT", isPK: false, isFK: true, refTable: "article" }
    ]
  },
  {
    id: "aspnetuser",
    name: "AspNetUser",
    x: 700,
    y: 450,
    color: "#64748b",
    columns: [
      { name: "Id", type: "VARCHAR(450)", isPK: true, isFK: false },
      { name: "UserName", type: "VARCHAR(256)" },
      { name: "Id_Magasin", type: "INT", isPK: false, isFK: true, refTable: "magasin" }
    ]
  },
  {
    id: "magasin",
    name: "Magasin",
    x: 700,
    y: 320,
    color: "#047857",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Nom", type: "VARCHAR(150)" }
    ]
  },
  {
    id: "modeletva",
    name: "ModeleTVA",
    x: 480,
    y: 480,
    color: "#ef4444",
    columns: [
      { name: "ID", type: "INT", isPK: true, isFK: false },
      { name: "Taux", type: "DECIMAL(5,2)" }
    ]
  }
];

export default function InteractiveDatabaseSchema() {
  const [tables, setTables] = useState(initialTables);
  const [selectedTable, setSelectedTable] = useState("article");
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("VARCHAR(100)");
  const [newColIsFK, setNewColIsFK] = useState(false);
  const [newColRef, setNewColRef] = useState("");
  
  // Gestion du Drag & Drop
  const [draggingTable, setDraggingTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e, tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingTable(tableId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingTable || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    // Limites de déplacement adaptées au conteneur
    const boundedX = Math.max(5, Math.min(x, 850));
    const boundedY = Math.max(5, Math.min(y, 550));

    setTables(prev => prev.map(t => {
      if (t.id === draggingTable) {
        return { ...t, x: boundedX, y: boundedY };
      }
      return t;
    }));
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

  const handleAddColumn = () => {
    if (!newColName || !selectedTable) return;

    setTables(prev => prev.map(t => {
      if (t.id === selectedTable) {
        return {
          ...t,
          columns: [
            ...t.columns,
            {
              name: newColName,
              type: newColType,
              isPK: false,
              isFK: newColIsFK,
              refTable: newColIsFK ? newColRef : undefined
            }
          ]
        };
      }
      return t;
    }));

    setNewColName("");
    setNewColIsFK(false);
    setNewColRef("");
  };

  const handleDeleteColumn = (tableId, colName) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.filter(c => c.name !== colName)
        };
      }
      return t;
    }));
  };

  const handleReset = () => {
    setTables(JSON.parse(JSON.stringify(initialTables)));
  };

  const renderRelations = () => {
    const paths = [];
    
    tables.forEach(sourceTable => {
      sourceTable.columns.forEach(col => {
        if (col.isFK && col.refTable) {
          const targetTable = tables.find(t => t.id === col.refTable);
          if (targetTable) {
            const sourceWidth = 180;
            const sourceHeight = 35 + sourceTable.columns.length * 24;
            const targetWidth = 180;
            const targetHeight = 35 + targetTable.columns.length * 24;

            const x1 = sourceTable.x + sourceWidth / 2;
            const y1 = sourceTable.y + sourceHeight / 2;
            const x2 = targetTable.x + targetWidth / 2;
            const y2 = targetTable.y + targetHeight / 2;

            const dx = Math.abs(x2 - x1) * 0.5;
            const dy = Math.abs(y2 - y1) * 0.5;
            const controlX1 = x1 + (x2 > x1 ? dx : -dx);
            const controlY1 = y1;
            const controlX2 = x2 + (x2 > x1 ? -dx : dx);
            const controlY2 = y2;

            paths.push(
              <g key={`${sourceTable.id}-${col.name}-${targetTable.id}`}>
                <path
                  d={`M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={sourceTable.color}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
                <circle cx={x2} cy={y2} r="4" fill={targetTable.color} />
                <rect x={x1 - 3} y={y1 - 3} width="6" height="6" fill={sourceTable.color} />
              </g>
            );
          }
        }
      });
    });

    return paths;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans select-none flex flex-col">
      {/* En-tête de l'application */}
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold tracking-tight">Schéma de Base de Données Interactif</h1>
          </div>
          <p className="text-slate-400 text-[11px]">
            Déplacez les boîtes à la souris pour réorganiser le diagramme.
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3 h-3" />
          Réinitialiser
        </button>
      </header>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        
        {/* Panneau Latéral Gauche (Formulaire d'édition) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 h-fit space-y-4">
          <div>
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Ajouter un champ
            </h2>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Table cible</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nom du champ</label>
                <input 
                  type="text"
                  placeholder="ex: Telephone"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Type</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none"
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value)}
                  >
                    <option value="INT">INT</option>
                    <option value="VARCHAR(50)">VARCHAR(50)</option>
                    <option value="VARCHAR(255)">VARCHAR(255)</option>
                    <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-300">
                    <input 
                      type="checkbox"
                      checked={newColIsFK}
                      onChange={(e) => setNewColIsFK(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-blue-500 w-3 h-3"
                    />
                    Clé (FK)
                  </label>
                </div>
              </div>

              {newColIsFK && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Cible de la relation (PK)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none"
                    value={newColRef}
                    onChange={(e) => setNewColRef(e.target.value)}
                  >
                    <option value="">-- Choisir --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleAddColumn}
                className="w-full mt-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md py-1 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" />
                Ajouter au schéma
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 block">Légende :</span>
            <div className="flex items-center gap-1.5"><Key className="w-3 h-3 text-yellow-500" /> Clé Primaire (PK)</div>
            <div className="flex items-center gap-1.5"><Link2 className="w-3 h-3 text-cyan-400" /> Clé Étrangère (FK)</div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-0.5 border-t border-dashed border-blue-500"></span>
              Ligne de relation
            </div>
          </div>
        </div>

        {/* Espace Graphique Interactif (Le Diagramme) */}
        <div className="lg:col-span-3 relative bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden min-h-[580px]">
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="absolute inset-0 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] overflow-auto"
          >
            {/* SVG pour dessiner les lignes de relations */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 min-w-[1000px] min-h-[600px]">
              {renderRelations()}
            </svg>

            {/* Rendu des Tables */}
            {tables.map((table) => (
              <div
                key={table.id}
                style={{
                  position: 'absolute',
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: '180px',
                  borderColor: table.color,
                }}
                className="bg-slate-950 border rounded-md shadow-lg overflow-hidden z-10"
              >
                {/* En-tête de la table (Drag Handle) */}
                <div 
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  style={{ backgroundColor: table.color }}
                  className="px-2 py-1 flex items-center justify-between text-white cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3 opacity-90" />
                    <span className="font-bold text-[11px] tracking-wide">{table.name}</span>
                  </div>
                  <Move className="w-2.5 h-2.5 opacity-50" />
                </div>

                {/* Liste des colonnes de la table */}
                <div className="p-0.5 divide-y divide-slate-900 bg-slate-950">
                  {table.columns.map((col, idx) => (
                    <div 
                      key={idx} 
                      className="px-1.5 py-0.5 flex items-center justify-between text-[10px] hover:bg-slate-900 group"
                    >
                      <div className="flex items-center gap-1">
                        {col.isPK && <Key className="w-2.5 h-2.5 text-yellow-500 shrink-0" />}
                        {col.isFK && <Link2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />}
                        {!col.isPK && !col.isFK && <div className="w-2.5 h-2.5" />}
                        <span className={`font-medium ${col.isPK ? 'text-yellow-400' : 'text-slate-300'}`}>
                          {col.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500 font-mono bg-slate-900 px-1 rounded">
                          {col.type}
                        </span>
                        {!col.isPK && (
                          <button 
                            onClick={() => handleDeleteColumn(table.id, col.name)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}