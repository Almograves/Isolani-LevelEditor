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

import { codeTabs, switchTab, addZoneTab, setupTabs } from './tabs.js';
import { renderStructures, setupEntityClickHandler, highlightEntityInZoneTab, renderIsolaniPieces, highlightGlobalEntityInBoardTab, renderEnemyPieces, renderGlobalStructures } from './entities.js';
import { setupEntityAddPanel } from './entityAddPanel.js';

setupTabs();
setupEntityAddPanel();

const renderBtn = document.getElementById('render-btn');
const boardGrid = document.querySelector('.board-grid');

let canvas, ctx;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let panOrigin = { x: 0, y: 0 };
let boardWidth = 0;
let boardHeight = 0;

function clearBoard() {
    boardGrid.innerHTML = '';
}

function createCanvas(width, height) {
    canvas = document.createElement('canvas');
    canvas.width = boardGrid.clientWidth;
    canvas.height = boardGrid.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.tabIndex = 0;
    ctx = canvas.getContext('2d');
    boardGrid.appendChild(canvas);
}

function getPlacedZones(boardJson) {
    return (boardJson.placedZones || []).map(z => z.zoneId);
}

function getZoneCells(zoneJson, worldPosition, rotation) {
    if (!zoneJson || !zoneJson.size) return [];
    const { width, height } = zoneJson.size;
    const cells = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            cells.push({ x: worldPosition.x + x, y: worldPosition.y + y });
        }
    }
    return cells;
}

function drawGridWithZones(boardJson, zones) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY); // No y-flip, origin is top-left
    ctx.scale(zoom, zoom); // Only scale, no flip
    // Draw zone cells first (light blue)
    for (const zone of zones) {
      ctx.fillStyle = 'rgba(100,180,255,0.35)';
      for (const cell of zone.cells) {
        ctx.fillRect(cell.x * 20, cell.y * 20, 20, 20);
      }
    }
    // Draw structures and collect clickable entities
    let clickableEntities = [];
    for (const zone of zones) {
      const zoneJson = parseZoneCode(zone.id);
      const zonePlacement = boardJson.placedZones.find(z => z.zoneId === zone.id);
      if (!zoneJson || !zonePlacement) continue;
      clickableEntities = clickableEntities.concat(
        renderStructures(ctx, zoom, offsetX, offsetY, boardHeight, zoneJson, zonePlacement.worldPosition, zone.id, onEntityClick)
      );
      clickableEntities = clickableEntities.concat(
        renderEnemyPieces(ctx, zoom, offsetX, offsetY, boardHeight, zoneJson, zonePlacement.worldPosition, zone.id, onEntityClick)
      );
    }
    // Draw IsolaniPiece(s) from globalEntities
    clickableEntities = clickableEntities.concat(
      renderIsolaniPieces(ctx, zoom, offsetX, offsetY, boardHeight, boardJson.globalEntities, onEntityClick)
    );
    // Draw Structure(s) from globalEntities
    clickableEntities = clickableEntities.concat(
      renderGlobalStructures(ctx, zoom, offsetX, offsetY, boardHeight, boardJson.globalEntities, onEntityClick)
    );
    ctx.strokeStyle = '#b0aea7';
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= boardWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * 20, 0);
      ctx.lineTo(x * 20, boardHeight * 20);
      ctx.stroke();
    }
    for (let y = 0; y <= boardHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * 20);
      ctx.lineTo(boardWidth * 20, y * 20);
      ctx.stroke();
    }
    ctx.restore();
    // Setup click handler
    if (canvas) setupEntityClickHandler(canvas, clickableEntities, onEntityClick, zoom, offsetX, offsetY, boardHeight);
    // Add handler for empty cell clicks
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left - offsetX) / zoom;
      const cy = (e.clientY - rect.top - offsetY) / zoom;
      const cellX = Math.floor(cx / 20);
      const cellY = Math.floor(cy / 20);
      let found = false;
      for (const item of clickableEntities) {
        if (
          cx >= item.x * 20 && cx < (item.x + 1) * 20 &&
          cy >= item.y * 20 && cy < (item.y + 1) * 20
        ) {
          onEntityClick(item, cellX, cellY);
          found = true;
          break;
        }
      }
      if (!found) {
        const entityInfo = document.querySelector('.entity-info');
        entityInfo.innerHTML = `<div><strong>Cell:</strong> (${cellX}, ${cellY})</div><div>No entity at this location.</div>`;
        let foundZone = null;
        try {
          const boardJson = codeTabs.board ? JSON.parse(codeTabs.board) : null;
          if (boardJson && Array.isArray(boardJson.placedZones)) {
            for (const zone of boardJson.placedZones) {
              const zoneJson = codeTabs[zone.zoneId] ? JSON.parse(codeTabs[zone.zoneId]) : null;
              if (!zoneJson || !zoneJson.size) continue;
              const zx = zone.worldPosition.x;
              const zy = zone.worldPosition.y;
              const zw = zoneJson.size.width;
              const zh = zoneJson.size.height;
              if (cellX >= zx && cellX < zx + zw && cellY >= zy && cellY < zy + zh) {
                foundZone = zone.zoneId;
                break;
              }
            }
          }
        } catch {}
        if (foundZone) {
          switchTab(foundZone);
        } else {
          switchTab('board');
        }
        window.dispatchEvent(new CustomEvent('board-empty-cell-click', { detail: { x: cellX, y: cellY, zoneId: foundZone } }));
      }
    };
  }

  function onEntityClick(item, cellX, cellY) {
    // 1. Switch to zone tab if it's a zone entity
    if (item.zoneId) {
      switchTab(item.zoneId);
      highlightEntityInZoneTab(item.zoneId, item.entityIndex);
    }
    // 2. Show entity info in right-column
    const entityInfo = document.querySelector('.entity-info');
    let html = `<div><strong>Cell:</strong> (${typeof cellX === 'number' ? cellX : item.x}, ${typeof cellY === 'number' ? cellY : item.y})</div>`;
    if (item.entityType === 'IsolaniPiece' || item.entity.type === 'IsolaniPiece') {
      switchTab('board');
      setTimeout(() => highlightGlobalEntityInBoardTab(item.entityIndex), 0);
      html += `<div><strong>Entity Type:</strong> IsolaniPiece</div>`;
      if (item.entity.properties) {
        html += `<div><strong>Collected Fragments:</strong> ${item.entity.properties.CollectedFragments?.join(', ') || ''}</div>`;
        html += `<div><strong>Equipped Fragments:</strong> ${item.entity.properties.EquippedFragments?.join(', ') || ''}</div>`;
      }
      entityInfo.innerHTML = html;
      return;
    }
    if (item.entity.type === 'EnemyPiece') {
      html += `<div><strong>Entity Type:</strong> EnemyPiece</div>`;
      html += `<div><strong>Faction:</strong> ${item.entity.properties.faction}</div>`;
      html += `<div><strong>Piece Type:</strong> ${item.entity.properties.pieceType}</div>`;
      html += `<div><strong>Movement Fragments:</strong> ${item.entity.properties.movementFragments?.join(', ') || ''}</div>`;
      entityInfo.innerHTML = html;
      return;
    }
    // Fallback: structure info
    html += `<div><strong>Entity Type:</strong> ${item.entity.type}</div>`;
    if (item.entity.type === 'Structure') {
      html += `<div><strong>Structure Type:</strong> ${item.entity.properties.structureType}</div>`;
      if (item.entity.properties.structureType === 'Checkpoint' && item.entity.properties.checkpointId) {
        html += `<div><strong>Checkpoint ID:</strong> ${item.entity.properties.checkpointId}</div>`;
      }
    }
    entityInfo.innerHTML = html;
  }

function setupBoardWithZones(boardJson, zones) {
    boardWidth = boardJson.globalSize.width;
    boardHeight = boardJson.globalSize.height;
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    clearBoard();
    createCanvas(boardWidth, boardHeight);
    drawGridWithZones(boardJson, zones);
    window.addEventListener('resize', resizeCanvasWithZones);
    setupInteractions();
}

function resizeCanvasWithZones() {
    if (!canvas) return;
    canvas.width = boardGrid.clientWidth;
    canvas.height = boardGrid.clientHeight;
    const boardJson = parseBoardCode();
    if (!boardJson) return;
    const placedZones = getPlacedZones(boardJson);
    const zones = placedZones.map(zoneId => {
        const zoneJson = parseZoneCode(zoneId);
        if (!zoneJson) return null;
        const zonePlacement = boardJson.placedZones.find(z => z.zoneId === zoneId);
        return {
            id: zoneId,
            cells: getZoneCells(zoneJson, zonePlacement.worldPosition, zonePlacement.rotation)
        };
    }).filter(Boolean);
    drawGridWithZones(boardJson, zones);
}

function setupInteractions() {
    if (!canvas) return;
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const mouseX = (e.offsetX - offsetX) / zoom;
        const mouseY = (e.offsetY - offsetY) / zoom;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        zoom *= zoomFactor;
        zoom = Math.max(0.1, Math.min(zoom, 10));
        offsetX -= (mouseX * (zoomFactor - 1)) * zoom;
        offsetY -= (mouseY * (zoomFactor - 1)) * zoom;
        drawGridWithZones(parseBoardCode(), getZonesForRender());
    });
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isPanning = true;
        startPan = { x: e.clientX, y: e.clientY };
        panOrigin = { x: offsetX, y: offsetY };
        canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        offsetX = panOrigin.x + (e.clientX - startPan.x);
        offsetY = panOrigin.y + (e.clientY - startPan.y);
        drawGridWithZones(parseBoardCode(), getZonesForRender());
    });
    window.addEventListener('mouseup', () => {
        isPanning = false;
        canvas.style.cursor = 'default';
    });
}

function parseBoardCode() {
    try {
        return JSON.parse(codeTabs.board);
    } catch {
        alert('Invalid board JSON!');
        return null;
    }
}
function parseZoneCode(zoneId) {
    try {
        return JSON.parse(codeTabs[zoneId]);
    } catch {
        return null;
    }
}
function getZonesForRender() {
    const boardJson = parseBoardCode();
    if (!boardJson) return [];
    const placedZones = getPlacedZones(boardJson);
    return placedZones.map(zoneId => {
        const zoneJson = parseZoneCode(zoneId);
        if (!zoneJson) return null;
        const zonePlacement = boardJson.placedZones.find(z => z.zoneId === zoneId);
        return {
            id: zoneId,
            cells: getZoneCells(zoneJson, zonePlacement.worldPosition, zonePlacement.rotation)
        };
    }).filter(Boolean);
}

renderBtn.addEventListener('click', () => {
    document.querySelectorAll('textarea.source-code').forEach(ta => {
        codeTabs[ta.dataset.tab] = ta.value;
    });
    const boardJson = parseBoardCode();
    if (!boardJson) return;
    const zones = getZonesForRender();
    setupBoardWithZones(boardJson, zones);
});
