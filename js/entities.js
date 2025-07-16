/*
 * This file is part of Isolani Level Editor.
 * Copyright (C) 2025 Felix/Almograves
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */ 

// Entity rendering and interaction for the board
import { codeTabs, switchTab } from './tabs.js';

export function renderStructures(ctx, zoom, offsetX, offsetY, boardHeight, zoneData, worldPosition, zoneId, onEntityClick) {
  if (!zoneData.entities) return [];
  const clickableEntities = [];
  for (let i = 0; i < zoneData.entities.length; i++) {
    const entity = zoneData.entities[i];
    if (entity.type !== 'Structure') continue;
    const gx = worldPosition.x + entity.position.x;
    const gy = worldPosition.y + entity.position.y;
    // Draw structure cell (cyan)
    ctx.save();
    ctx.fillStyle = 'rgba(0,255,255,0.5)';
    ctx.strokeStyle = '#00bfcf';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.rect(gx * 20, gy * 20, 20, 20);
    ctx.fill();
    ctx.stroke();
    // Draw label
    ctx.fillStyle = '#000';
    ctx.font = `${14 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let label = '?';
    if (entity.properties.structureType === 'Wall') label = 'W';
    else if (entity.properties.structureType === 'Checkpoint') label = 'C';
    else if (entity.properties.structureType === 'Safezone') label = 'S';
    ctx.fillText(label, gx * 20 + 10, gy * 20 + 10);
    ctx.restore();
    // Store clickable area
    clickableEntities.push({
      zoneId,
      entityIndex: i,
      x: gx,
      y: gy,
      entity
    });
  }
  return clickableEntities;
}

export function renderIsolaniPieces(ctx, zoom, offsetX, offsetY, boardHeight, globalEntities, onEntityClick) {
  if (!globalEntities) return [];
  const clickableEntities = [];
  for (let i = 0; i < globalEntities.length; i++) {
    const entity = globalEntities[i];
    if (entity.type !== 'IsolaniPiece') continue;
    const gx = entity.position.x;
    const gy = entity.position.y;
    // Draw magenta circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(gx * 20 + 10, gy * 20 + 10, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'magenta';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#a000a0';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    // Draw 'I' label
    ctx.fillStyle = '#fff';
    ctx.font = `${14 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('I', gx * 20 + 10, gy * 20 + 10);
    ctx.restore();
    clickableEntities.push({
      entityType: 'IsolaniPiece',
      entityIndex: i,
      x: gx,
      y: gy,
      entity
    });
  }
  return clickableEntities;
}

export function renderEnemyPieces(ctx, zoom, offsetX, offsetY, boardHeight, zoneData, worldPosition, zoneId, onEntityClick) {
  if (!zoneData.entities) return [];
  const clickableEntities = [];
  const factionColors = {
    North: { fill: 'rgba(0,120,255,0.5)', stroke: '#0050b0' },
    East: { fill: 'rgba(255,220,0,0.5)', stroke: '#b0a000' },
    South: { fill: 'rgba(255,60,60,0.5)', stroke: '#b00000' },
    West: { fill: 'rgba(60,200,60,0.5)', stroke: '#008000' }
  };
  const pieceLetters = {
    Knight: 'K',
    King: 'A',
    Queen: 'Q',
    Rook: 'R',
    Bishop: 'B',
    Pawn: 'P'
  };
  for (let i = 0; i < zoneData.entities.length; i++) {
    const entity = zoneData.entities[i];
    if (entity.type !== 'EnemyPiece') continue;
    const gx = worldPosition.x + entity.position.x;
    const gy = worldPosition.y + entity.position.y;
    const faction = entity.properties.faction;
    const color = factionColors[faction] || { fill: 'rgba(180,180,180,0.5)', stroke: '#888' };
    // Draw colored circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(gx * 20 + 10, gy * 20 + 10, 10, 0, 2 * Math.PI);
    ctx.fillStyle = color.fill;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    // Draw piece letter
    ctx.fillStyle = '#000';
    ctx.font = `${14 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letter = pieceLetters[entity.properties.pieceType] || '?';
    ctx.fillText(letter, gx * 20 + 10, gy * 20 + 10);
    ctx.restore();
    clickableEntities.push({
      zoneId,
      entityIndex: i,
      x: gx,
      y: gy,
      entity
    });
  }
  return clickableEntities;
}

export function renderGlobalStructures(ctx, zoom, offsetX, offsetY, boardHeight, globalEntities, onEntityClick) {
  if (!globalEntities) return [];
  const clickableEntities = [];
  for (let i = 0; i < globalEntities.length; i++) {
    const entity = globalEntities[i];
    if (entity.type !== 'Structure') continue;
    if (!entity.properties || entity.properties.structureType !== 'Wall') continue;
    const gx = entity.position.x;
    const gy = entity.position.y;
    // Draw structure cell (cyan)
    ctx.save();
    ctx.fillStyle = 'rgba(0,255,255,0.5)';
    ctx.strokeStyle = '#00bfcf';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.rect(gx * 20, gy * 20, 20, 20);
    ctx.fill();
    ctx.stroke();
    // Draw label
    ctx.fillStyle = '#000';
    ctx.font = `${14 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', gx * 20 + 10, gy * 20 + 10);
    ctx.restore();
    clickableEntities.push({
      entityType: 'Structure',
      entityIndex: i,
      x: gx,
      y: gy,
      entity
    });
  }
  return clickableEntities;
}

export function setupEntityClickHandler(canvas, clickableEntities, onEntityClick, zoom, offsetX, offsetY, boardHeight) {
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    // Transform click to board coordinates (no y-flip)
    const cx = (e.clientX - rect.left - offsetX) / zoom;
    const cy = (e.clientY - rect.top - offsetY) / zoom;
    for (const item of clickableEntities) {
      if (
        cx >= item.x * 20 && cx < (item.x + 1) * 20 &&
        cy >= item.y * 20 && cy < (item.y + 1) * 20
      ) {
        onEntityClick(item);
        break;
      }
    }
  };
}

export function highlightEntityInZoneTab(zoneId, entityIndex) {
  // Find the textarea for the zone
  const ta = document.querySelector(`textarea.source-code[data-tab="${zoneId}"]`);
  if (!ta) return;
  try {
    const json = JSON.parse(ta.value);
    const entity = json.entities[entityIndex];
    if (!entity) return;
    // Try to find the entity by its position line
    const pos = entity.position;
    const posStr = `"position": {\n        \"x\": ${pos.x},\n        \"y\": ${pos.y}`;
    const idx = ta.value.indexOf(posStr);
    if (idx !== -1) {
      ta.focus();
      ta.setSelectionRange(idx, idx + posStr.length);
      // Scroll to selection
      const line = ta.value.substr(0, idx).split('\n').length;
      const lineHeight = 20; // Approximate line height in px
      ta.scrollTop = (line - 2) * lineHeight;
      return;
    }
    // Fallback: try to find the stringified entity
    const entityStr = JSON.stringify(entity, null, 2);
    const idx2 = ta.value.indexOf(entityStr);
    if (idx2 !== -1) {
      ta.focus();
      ta.setSelectionRange(idx2, idx2 + entityStr.length);
      // Scroll to selection
      const line = ta.value.substr(0, idx2).split('\n').length;
      const lineHeight = 20;
      ta.scrollTop = (line - 2) * lineHeight;
    }
  } catch {}
}

export function highlightGlobalEntityInBoardTab(entityIndex) {
  const ta = document.querySelector('textarea.source-code[data-tab="board"]');
  if (!ta) {
    console.warn('Board textarea not found');
    return;
  }
  try {
    const json = JSON.parse(ta.value);
    const entity = json.globalEntities?.[entityIndex];
    if (!entity) {
      console.warn('Entity not found at index', entityIndex, 'in globalEntities', json.globalEntities);
      return;
    }
    // Find the nth occurrence of '"type": "IsolaniPiece"'
    let count = 0;
    let lastIdx = -1;
    let searchIdx = 0;
    while (count <= entityIndex) {
      lastIdx = ta.value.indexOf('"type": "IsolaniPiece"', searchIdx);
      if (lastIdx === -1) break;
      if (count === entityIndex) break;
      count++;
      searchIdx = lastIdx + 1;
    }
    if (lastIdx !== -1) {
      // Try to select the block from lastIdx to the next '},' or '}]' or '}'
      let endIdx = ta.value.indexOf('},', lastIdx);
      if (endIdx === -1) endIdx = ta.value.indexOf('}]', lastIdx);
      if (endIdx === -1) endIdx = ta.value.indexOf('}', lastIdx);
      if (endIdx !== -1) {
        endIdx += 1; // include closing brace
        ta.focus();
        ta.setSelectionRange(lastIdx, endIdx);
        const line = ta.value.substr(0, lastIdx).split('\n').length;
        const lineHeight = 20;
        setTimeout(() => { ta.scrollTop = (line - 2) * lineHeight; }, 0);
        console.debug('Selected IsolaniPiece by nth occurrence:', lastIdx, endIdx);
        return;
      }
    }
    console.warn('Could not find entity in textarea for highlighting');
  } catch (e) {
    console.error('Error in highlightGlobalEntityInBoardTab:', e);
  }
} 