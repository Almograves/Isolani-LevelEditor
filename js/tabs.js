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

// Tab management for the code editor
export const codeTabs = { board: '' };
export let activeTab = 'board';

let tabBar, tabContent;

export function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('textarea.source-code').forEach(ta => {
    ta.classList.toggle('active', ta.dataset.tab === tabId);
  });
}

export function addZoneTab(zoneId, initialValue = '') {
  if (codeTabs[zoneId]) return;
  // Use template if no initialValue
  if (!initialValue) {
    initialValue = `{
  "zoneId": "${zoneId}",
  "name": "none",
  "size": {
    "width": 0,
    "height": 0
  },
  "entities": [
  ],
  "metadata": {
    "difficulty": 0,
    "theme": "none",
    "isBeaten": false,
    "questTriggers": [
    ]
  }
}`;
  }
  codeTabs[zoneId] = initialValue;
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.dataset.tab = zoneId;
  btn.textContent = zoneId;
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Close tab';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to close the tab "${zoneId}"?`)) {
      delete codeTabs[zoneId];
      btn.remove();
      ta.remove();
      if (activeTab === zoneId) switchTab('board');
    }
  });
  btn.appendChild(closeBtn);
  btn.addEventListener('click', () => switchTab(zoneId));
  tabBar.insertBefore(btn, document.querySelector('.tab-add'));
  // Add textarea
  const ta = document.createElement('textarea');
  ta.className = 'source-code';
  ta.dataset.tab = zoneId;
  ta.value = initialValue;
  ta.addEventListener('input', () => {
    codeTabs[zoneId] = ta.value;
  });
  tabContent.appendChild(ta);
}

export function setupTabs() {
  tabBar = document.querySelector('.tab-bar');
  tabContent = document.querySelector('.tab-content');
  // Handle tab switching
  Array.from(document.querySelectorAll('.tab')).forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  // Handle textarea input
  Array.from(document.querySelectorAll('textarea.source-code')).forEach(ta => {
    ta.addEventListener('input', () => {
      codeTabs[ta.dataset.tab] = ta.value;
    });
  });
  // Handle + button
  const addBtn = document.querySelector('.tab-add');
  addBtn.addEventListener('click', () => {
    let zoneId = prompt('Enter zoneId (e.g. alpha-01):');
    if (!zoneId) return;
    zoneId = zoneId.trim();
    if (!zoneId) return;
    if (codeTabs[zoneId]) {
      switchTab(zoneId);
      return;
    }
    addZoneTab(zoneId);
    switchTab(zoneId);
  });
  // Initial state
  codeTabs.board = document.querySelector('textarea.source-code[data-tab="board"]').value;
  switchTab('board');
} 