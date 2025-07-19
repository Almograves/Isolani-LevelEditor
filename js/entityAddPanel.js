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

import { codeTabs, switchTab } from './tabs.js';
// Handles tab switching for the entity add panel
export function setupEntityAddPanel() {
  let lastCell = { x: 0, y: 0, zoneId: null, localX: 0, localY: 0 };
  const typeTabs = document.querySelectorAll('.entity-type-tab');
  const subtypeSelectors = {
    EnemyPiece: document.querySelector('.enemypiece-subtype-selector'),
    NeutralPiece: document.querySelector('.neutralpiece-subtype-selector'),
    Structure: document.querySelector('.structure-subtype-selector'),
    Decoration: document.querySelector('.decoration-subtype-selector'),
  };
  const factionSelector = document.querySelector('.entity-enemy-faction-selector');
  const templateTextarea = document.querySelector('.entity-template-json');

  // Helper to update template preview
  function updateEntityTemplate(x, y, localX, localY) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      x = lastCell.x;
      y = lastCell.y;
    }
    if (typeof localX !== 'number' || typeof localY !== 'number') {
      localX = lastCell.localX;
      localY = lastCell.localY;
    }
    templateTextarea.value = buildEntityTemplate(x, y, localX, localY);
  }

  // Helper to get current selection
  function getCurrentEntitySelection() {
    const typeTab = document.querySelector('.entity-type-tab.active');
    const type = typeTab?.dataset.entityType ?? 'NeutralPiece';
    let subtype = '';
    if (type === 'EnemyPiece') {
      subtype = document.querySelector('.enemypiece-subtype-selector .entity-subtype-tab.active')?.dataset.pieceType
        ?? document.querySelector('.enemypiece-subtype-selector .entity-subtype-tab')?.dataset.pieceType
        ?? '';
    } else if (type === 'Structure') {
      subtype = document.querySelector('.structure-subtype-selector .entity-subtype-tab.active')?.dataset.structureType
        ?? document.querySelector('.structure-subtype-selector .entity-subtype-tab')?.dataset.structureType
        ?? '';
    } else if (type === 'NeutralPiece') {
      subtype = document.querySelector('.neutralpiece-subtype-selector .entity-subtype-tab.active')?.dataset.neutralType
        ?? '';
    } else if (type === 'Decoration') {
      subtype = document.querySelector('.decoration-subtype-selector .entity-subtype-tab.active')?.dataset.decorationType
        ?? '';
    }
    let faction = '';
    if (type === 'EnemyPiece') {
      const selectedFaction = document.querySelector('.entity-enemy-faction-selector button.selected');
      faction =
        selectedFaction?.classList.contains('entity-enemy-faction-north') ? 'North' :
        selectedFaction?.classList.contains('entity-enemy-faction-east') ? 'East' :
        selectedFaction?.classList.contains('entity-enemy-faction-south') ? 'South' :
        selectedFaction?.classList.contains('entity-enemy-faction-west') ? 'West' : 'South';
    }
    return { type, subtype, faction };
  }

  // Helper to build template
  function buildEntityTemplate(x = 0, y = 0, localX = 0, localY = 0) {
    const { type, subtype } = getCurrentEntitySelection();
    // If we're adding to a zone, use local coordinates
    const useLocal = lastCell.zoneId != null;
    const pos = useLocal ? { x: localX, y: localY } : { x, y };
    if (type === 'EnemyPiece') {
      return JSON.stringify({
        type: 'EnemyPiece',
        position: pos,
        rotation: 0,
        properties: {
          faction: getCurrentEntitySelection().faction,
          pieceType: subtype,
          movementFragments: []
        }
      }, null, 4);
    }
    if (type === 'Structure') {
      const template = {
        type: 'Structure',
        position: pos,
        rotation: 0,
        properties: { structureType: subtype }
      };
      if (subtype === 'Checkpoint') template.properties.checkpointId = "";
      return JSON.stringify(template, null, 4);
    }
    // Add more templates for other types if needed
    return '{}';
  }

  // --- Tab switching logic ---
  typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      typeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.entries(subtypeSelectors).forEach(([type, el]) => {
        if (el) el.style.display = (tab.dataset.entityType === type) ? '' : 'none';
      });
      // Show/hide faction selector
      factionSelector.style.display = (tab.dataset.entityType === 'EnemyPiece') ? '' : 'none';
      // Set first subtype tab as active
      const activeSubtype = subtypeSelectors[tab.dataset.entityType]?.querySelector('.entity-subtype-tab');
      if (activeSubtype) {
        subtypeSelectors[tab.dataset.entityType].querySelectorAll('.entity-subtype-tab').forEach(st => st.classList.remove('active'));
        activeSubtype.classList.add('active');
      }
      updateEntityTemplate();
    });
  });

  // Subtype tab switching
  Object.values(subtypeSelectors).forEach(sel => {
    if (!sel) return;
    sel.querySelectorAll('.entity-subtype-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sel.querySelectorAll('.entity-subtype-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateEntityTemplate();
      });
    });
  });

  // Faction button selection logic
  const factionBtns = factionSelector.querySelectorAll('button');
  factionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      factionBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateEntityTemplate();
    });
  });

  // Initialize: show only the default (NeutralPiece) subtype selector
  Object.entries(subtypeSelectors).forEach(([type, el]) => {
    if (el) el.style.display = (type === 'NeutralPiece') ? '' : 'none';
  });

  // Initial template
  updateEntityTemplate();

  function updateAddButton() {
    const { type, subtype } = getCurrentEntitySelection();
    const addBtn = document.querySelector('.add-entity-btn');
    const { zoneId } = lastCell;
    if (
      (type === 'EnemyPiece' && zoneId) ||
      (type === 'Structure' && (subtype === 'Safezone' || subtype === 'Checkpoint') && zoneId) ||
      (type !== 'EnemyPiece' && type !== 'Structure') ||
      (type === 'Structure' && subtype !== 'Safezone' && subtype !== 'Checkpoint')
    ) {
      addBtn.disabled = false;
    } else {
      addBtn.disabled = true;
    }
  }

  window.addEventListener('board-empty-cell-click', e => {
    const { x, y, zoneId } = e.detail;
    let localX = x, localY = y;
    if (zoneId) {
      // Find the zone's worldPosition
      try {
        const boardJson = codeTabs.board ? JSON.parse(codeTabs.board) : null;
        const zone = boardJson?.placedZones?.find(z => z.zoneId === zoneId);
        if (zone && zone.worldPosition) {
          localX = x - zone.worldPosition.x;
          localY = y - zone.worldPosition.y;
        }
      } catch {}
    }
    lastCell = { x, y, zoneId, localX, localY };
    updateEntityTemplate(x, y, localX, localY);
    updateAddButton();
  });

  // Add entity to the correct tab when Add is pressed
  document.querySelector('.add-entity-btn').addEventListener('click', () => {
    const { type, subtype } = getCurrentEntitySelection();
    const template = templateTextarea.value;
    let entity;
    try {
      entity = JSON.parse(template);
    } catch {
      alert('Invalid entity template!');
      return;
    }
    // Determine which tab is active
    const activeTabBtn = document.querySelector('.tab.active');
    const tabId = activeTabBtn?.dataset.tab;
    if (!tabId) return;
    const textarea = document.querySelector(`textarea.source-code[data-tab="${tabId}"]`);
    if (!textarea) return;
    let json;
    try {
      json = JSON.parse(textarea.value);
    } catch {
      alert('Invalid JSON in tab!');
      return;
    }
    if (tabId === 'board') {
      if (!Array.isArray(json.globalEntities)) json.globalEntities = [];
      json.globalEntities.push(entity);
    } else {
      if (!Array.isArray(json.entities)) json.entities = [];
      json.entities.push(entity);
    }
    const newValue = JSON.stringify(json, null, 2);
    textarea.value = newValue;
    codeTabs[tabId] = newValue;
    textarea.dispatchEvent(new Event('input'));
    // Optionally, disable Add button until a new cell is selected
    document.querySelector('.add-entity-btn').disabled = true;
    // Trigger render
    document.getElementById('render-btn')?.click();
  });

  // Also update Add button and template on tab/subtype/faction change
  function addUpdateButtonListeners() {
    document.querySelectorAll('.entity-type-tab, .entity-subtype-tab, .entity-enemy-faction-selector button').forEach(el => {
      el.addEventListener('click', () => {
        updateEntityTemplate();
        updateAddButton();
      });
    });
  }
  addUpdateButtonListeners();
} 