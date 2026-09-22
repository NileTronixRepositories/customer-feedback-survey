import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parseTemplate } from '@angular/compiler';

const root = path.resolve('src/app');
const dictionaryFile = path.join(root, 'core/services/i18n.service.ts');
const source = ts.createSourceFile(dictionaryFile, fs.readFileSync(dictionaryFile, 'utf8'), ts.ScriptTarget.Latest, true);
const dictionaries = new Map();
const duplicateKeys = [];

function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'TRANSLATIONS') {
    const value = node.initializer;
    if (value && ts.isObjectLiteralExpression(value)) {
      for (const locale of value.properties) {
        if (!ts.isPropertyAssignment(locale) || !ts.isObjectLiteralExpression(locale.initializer)) continue;
        const language = locale.name.getText(source);
        const entries = new Map();
        for (const entry of locale.initializer.properties) {
          if (!ts.isPropertyAssignment(entry)) continue;
          const key = entry.name.getText(source).slice(1, -1);
          const text = entry.initializer.getText(source).slice(1, -1);
          if (entries.has(key)) duplicateKeys.push(`${language}: ${key}`);
          entries.set(key, text);
        }
        dictionaries.set(language, entries);
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);

const files = [];
function collect(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) collect(filename);
    else if (/\.(html|ts)$/.test(item.name) && filename !== dictionaryFile) files.push(filename);
  }
}
collect(root);

const used = new Map();
for (const filename of files) {
  const contents = fs.readFileSync(filename, 'utf8');
  const patterns = filename.endsWith('.html')
    ? [/['"]([a-z][\w-]*(?:\.[\w-]+)+)['"]\s*\|\s*t\b/g]
    : [/\b(?:translate|translateKey)\(\s*['"`]([a-z][\w-]*(?:\.[\w-]+)+)['"`]/g,
       /\b(?:labelKey|titleKey|descriptionKey|subtitleKey|placeholderKey)\s*:\s*['"`]([a-z][\w-]*(?:\.[\w-]+)+)['"`]/g];
  for (const pattern of patterns) for (const match of contents.matchAll(pattern)) {
    const key = match[1];
    if (!used.has(key)) used.set(key, []);
    used.get(key).push(path.relative(root, filename));
  }
}

const en = dictionaries.get('en') ?? new Map();
const ar = dictionaries.get('ar') ?? new Map();
const missingEnglish = [...ar.keys()].filter((key) => !en.has(key));
const missingArabic = [...en.keys()].filter((key) => !ar.has(key));
const missingUsed = [...used].filter(([key]) => !en.has(key) && !ar.has(key));
const hardcodedTemplateText = [];
for (const filename of files.filter((name) => name.endsWith('.html'))) {
  const template = parseTemplate(fs.readFileSync(filename, 'utf8'), filename);
  function inspect(node) {
    if (node.constructor.name === 'Text' && /[A-Za-z\u0600-\u06ff]{2,}/.test(node.value)) {
      if (node.value.trim() !== 'www.niletronix.com') {
        hardcodedTemplateText.push({ file: path.relative(root, filename), text: node.value.trim() });
      }
    }
    for (const attribute of node.attributes ?? []) {
      if (/^(placeholder|aria-label|title|alt)$/.test(attribute.name) && /[A-Za-z\u0600-\u06ff]{2,}/.test(attribute.value) && attribute.value !== 'NILETRONIX') {
        hardcodedTemplateText.push({ file: path.relative(root, filename), text: `${attribute.name}: ${attribute.value}` });
      }
    }
    for (const child of node.children ?? []) inspect(child);
  }
  for (const node of template.nodes) inspect(node);
}

const errors = [
  ...duplicateKeys.map((key) => `Duplicate translation: ${key}`),
  ...missingEnglish.map((key) => `Missing English translation: ${key}`),
  ...missingArabic.map((key) => `Missing Arabic translation: ${key}`),
  ...missingUsed.map(([key, locations]) => `Missing translation: ${key} (${locations[0]})`),
  ...hardcodedTemplateText.map(({ file, text }) => `Untranslated template text: ${text} (${file})`),
];
console.log(`Checked ${en.size} English and ${ar.size} Arabic translations across ${files.length} source files.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('All referenced keys have translations in both languages; no hardcoded template text found.');
}
