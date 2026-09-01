const reserved = new Set(['class', 'namespace', 'event', 'string', 'int', 'decimal', 'bool', 'object', 'public', 'private', 'internal', 'new', 'base', 'params']);

const identifier = (value, fallback = 'Value') => {
  const words = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z0-9]+/g) || [];
  let result = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('') || fallback;
  if (/^\d/.test(result)) result = `_${result}`;
  return reserved.has(result.toLowerCase()) ? `@${result}` : result;
};

const pluralize = (name) => name.endsWith('s') ? `${name}Set` : `${name}s`;

const scalarType = (type, enums) => {
  if (type.startsWith('ENUM:')) return identifier(enums.find((item) => item.id === type.slice(5))?.name, 'UnknownEnum');
  if (type.startsWith('LIST:')) return `List<${scalarType(type.slice(5), enums)}>`;
  if (type.startsWith('VARCHAR') || type === 'TEXT') return 'string';
  if (type === 'INT') return 'int';
  if (type === 'BIGINT') return 'long';
  if (type.startsWith('DECIMAL')) return 'decimal';
  if (type === 'BOOLEAN') return 'bool';
  if (type === 'DATE' || type === 'DATETIME') return 'DateTime';
  return 'string';
};

const isReferenceType = (type) => type === 'string' || type.startsWith('List<');
const escapeCSharp = (value) => String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const navigationName = (column, targetName) => {
  const cleaned = column.name.replace(/^Id[_-]?/i, '').replace(/[_-]?Id$/i, '');
  return identifier(cleaned || targetName, targetName);
};

export function buildEntityFrameworkFiles(tables, enums) {
  const files = {};
  const tableClass = new Map(tables.map((table) => [table.id, identifier(table.name, 'Entity')]));

  enums.forEach((definition) => {
    const enumName = identifier(definition.name, 'GeneratedEnum');
    const used = new Set();
    const values = definition.values.map((value, index) => {
      let name = identifier(value, `Value${index + 1}`);
      while (used.has(name)) name = `${name}${index + 1}`;
      used.add(name);
      return `    [EnumMember(Value = "${escapeCSharp(value)}")]\n    ${name} = ${index}`;
    });
    files[`Enums/${enumName}.cs`] = `using System.Runtime.Serialization;\n\nnamespace ReLifeShared.Enums;\n\npublic enum ${enumName}\n{\n${values.join(',\n\n')}\n}\n`;
  });

  tables.forEach((table) => {
    const className = tableClass.get(table.id);
    const properties = table.columns.map((column) => {
      const baseType = scalarType(column.type, enums);
      const nullable = column.isNullable && !column.isPK;
      const type = nullable && !baseType.startsWith('List<') ? `${baseType}?` : baseType;
      const attributes = [column.isPK ? '    [Key]' : '', `    [Column("${escapeCSharp(column.name)}")]`].filter(Boolean).join('\n');
      let initializer = '';
      if (baseType.startsWith('List<')) initializer = ' = new();';
      else if (baseType === 'string' && !nullable) initializer = ' = string.Empty;';
      return `${attributes}\n    public ${type} ${identifier(column.name, 'Field')} { get; set; }${initializer}`;
    });

    const navigations = [];
    table.columns.filter((column) => column.isFK && column.refTable).forEach((column) => {
      const target = tables.find((item) => item.id === column.refTable);
      if (!target) return;
      const targetName = tableClass.get(target.id);
      const nav = navigationName(column, targetName);
      const optional = column.isNullable || column.targetMultiplicity === '0..1';
      navigations.push(`    [ForeignKey(nameof(${identifier(column.name, 'Field')}))]\n    public ${targetName}${optional ? '?' : ''} ${nav} { get; set; }${optional ? '' : ' = null!;'}`);
    });

    tables.forEach((source) => source.columns.filter((column) => column.isFK && column.refTable === table.id).forEach((column) => {
      const sourceName = tableClass.get(source.id);
      const reverseBase = `${sourceName}${source.columns.filter((item) => item.isFK && item.refTable === table.id).length > 1 ? identifier(column.name) : ''}`;
      if (column.sourceMultiplicity === '1' || column.sourceMultiplicity === '0..1') {
        navigations.push(`    public ${sourceName}${column.sourceMultiplicity === '0..1' ? '?' : ''} ${reverseBase} { get; set; }${column.sourceMultiplicity === '1' ? ' = null!;' : ''}`);
      } else {
        navigations.push(`    public ICollection<${sourceName}> ${pluralize(reverseBase)} { get; set; } = new List<${sourceName}>();`);
      }
    }));

    files[`Entities/${className}.cs`] = `using System;\nusing System.Collections.Generic;\nusing System.ComponentModel.DataAnnotations;\nusing System.ComponentModel.DataAnnotations.Schema;\nusing ReLifeShared.Enums;\n\nnamespace ReLifeShared.Entities;\n\n[Table("${escapeCSharp(table.name)}")]\npublic class ${className}\n{\n${[...properties, ...navigations].join('\n\n')}\n}\n`;
  });

  const sets = tables.map((table) => {
    const name = tableClass.get(table.id);
    return `    public DbSet<${name}> ${pluralize(name)} => Set<${name}>();`;
  }).join('\n');

  const configurations = [];
  tables.forEach((table) => {
    const sourceName = tableClass.get(table.id);
    table.columns.filter((column) => column.isFK && column.refTable).forEach((column) => {
      const target = tables.find((item) => item.id === column.refTable);
      if (!target) return;
      const targetName = tableClass.get(target.id);
      const nav = navigationName(column, targetName);
      const reverseBase = `${sourceName}${table.columns.filter((item) => item.isFK && item.refTable === target.id).length > 1 ? identifier(column.name) : ''}`;
      const reverse = column.sourceMultiplicity === '1' || column.sourceMultiplicity === '0..1' ? reverseBase : pluralize(reverseBase);
      const withMethod = column.sourceMultiplicity === '1' || column.sourceMultiplicity === '0..1' ? 'WithOne' : 'WithMany';
      configurations.push(`        modelBuilder.Entity<${sourceName}>()\n            .HasOne(entity => entity.${nav})\n            .${withMethod}(entity => entity.${reverse})\n            .HasForeignKey<${sourceName}>(entity => entity.${identifier(column.name, 'Field')})\n            .IsRequired(${column.isNullable ? 'false' : 'true'});`);
    });
  });

  files['ReLifeDbContext.cs'] = `using Microsoft.EntityFrameworkCore;\nusing ReLifeShared.Entities;\n\nnamespace ReLifeShared;\n\npublic class ReLifeDbContext : DbContext\n{\n    public ReLifeDbContext(DbContextOptions<ReLifeDbContext> options) : base(options) { }\n\n${sets}\n\n    protected override void OnModelCreating(ModelBuilder modelBuilder)\n    {\n        base.OnModelCreating(modelBuilder);\n\n${configurations.join('\n\n')}\n    }\n}\n`;

  files['ReLifeShared.csproj'] = `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />\n  </ItemGroup>\n</Project>\n`;
  return files;
}

export async function writeEntityFrameworkFolder(files) {
  if (!window.showDirectoryPicker) return false;
  const parent = await window.showDirectoryPicker({ mode: 'readwrite' });
  const folder = await parent.getDirectoryHandle('ReLifeShared', { create: true });
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let directory = folder;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part, { create: true });
    const handle = await directory.getFileHandle(parts.at(-1), { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }
  return true;
}
