document.addEventListener('DOMContentLoaded', () => {
    const cfList = document.getElementById('cf-list');
    const searchInput = document.getElementById('cf-search');
    const difficultySelect = document.getElementById('cf-difficulty');
    const statusPopup = document.getElementById('status-popup');
    const notePopupBtn = document.getElementById('note-button-popup');
    let currentPopupProblemId = null;

    const baseProblems = [
        { id: '4A', name: 'Watermelon', rating: 800, tags: ['brute force'] },
        { id: '71A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
        { id: '158A', name: 'Next Round', rating: 800, tags: ['implementation'] },
        { id: '231A', name: 'Team', rating: 800, tags: ['greedy'] },
        { id: '50A', name: 'Domino piling', rating: 800, tags: ['greedy', 'math'] },
        { id: '282A', name: 'Bit++', rating: 800, tags: ['implementation'] },
        { id: '112A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
        { id: '339A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
        { id: '263A', name: 'Beautiful Matrix', rating: 800, tags: ['implementation'] },
        { id: '118A', name: 'String Task', rating: 1000, tags: ['strings'] },
        { id: '58A', name: 'Chat room', rating: 1000, tags: ['strings'] },
        { id: '69A', name: 'Young Physicist', rating: 1000, tags: ['implementation', 'math'] },
        { id: '122A', name: 'Lucky Division', rating: 1000, tags: ['brute force', 'number theory'] },
        { id: '131A', name: 'cAPS lOCK', rating: 1000, tags: ['implementation', 'strings'] },
        { id: '479A', name: 'Expression', rating: 1000, tags: ['brute force', 'math'] },
        { id: '230B', name: 'T-primes', rating: 1300, tags: ['binary search', 'number theory'] },
        { id: '489C', name: 'Given Length and Sum of Digits...', rating: 1400, tags: ['greedy', 'dp'] },
        { id: '455A', name: 'Boredom', rating: 1500, tags: ['dp'] },
        { id: '580C', name: 'Kefa and Park', rating: 1500, tags: ['dfs', 'trees'] },
        { id: '189A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
        { id: '1352C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
        { id: '1360E', name: 'Polygon', rating: 1300, tags: ['implementation'] },
        { id: '1360C', name: 'Similar Pairs', rating: 1000, tags: ['greedy'] },
        { id: '166E', name: 'Tetrahedron', rating: 1500, tags: ['dp', 'math'] },
        { id: '545C', name: 'Woodcutters', rating: 1500, tags: ['dp', 'greedy'] },
        { id: '1324D', name: 'Pair of Topics', rating: 1400, tags: ['binary search', 'greedy', 'sortings'] },
        { id: '1367C', name: 'Social Distance', rating: 1200, tags: ['greedy'] },
        { id: '1335C', name: 'Two Teams Composing', rating: 1100, tags: ['binary search', 'greedy', 'sortings'] },
        { id: '1195C', name: 'Basketball Exercise', rating: 1400, tags: ['dp'] },
        { id: '276C', name: 'Little Girl and Maximum Sum', rating: 1600, tags: ['data structures', 'greedy', 'sortings'] },
        { id: '1399C', name: 'Boats Competition', rating: 1200, tags: ['brute force', 'greedy'] },
        { id: '466C', name: 'Number of Ways', rating: 1700, tags: ['data structures', 'dp'] },
        { id: '1399D', name: 'Binary Removals', rating: 1000, tags: ['greedy'] },
        { id: '1374D', name: 'Zero Remainder Array', rating: 1400, tags: ['greedy', 'math', 'sortings'] }
    ];

    function getAllProblems() {
        const userProblems = JSON.parse(localStorage.getItem('cf_custom_problems') || '[]');
        return [...baseProblems, ...userProblems];
    }

    function getDiffClass(rating) {
        if (rating < 1200) return 'diff-easy';
        if (rating < 1600) return 'diff-medium';
        if (rating < 2000) return 'diff-hard';
        return 'diff-extreme';
    }

    let currentNoteId = null;
    const noteOverlay = document.getElementById('note-overlay');
    const mdTextarea = document.getElementById('md-textarea');
    const mdPreview = document.getElementById('md-preview');
    const noteSaveBtn = document.getElementById('note-save');
    const noteCloseBtn = document.getElementById('note-close');
    const mdToggleBtn = document.getElementById('md-toggle');

    function mdEscape(html) {
        return html.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

    function mdInline(line) {
        line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
        line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
        line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        return line;
    }

    function renderMarkdownPreview(text) {
        if (!mdPreview) return;
        const lines = (text || '').replace(/\r/g, '').split('\n');
        let html = '';
        lines.forEach(line => {
            if (line.trim().startsWith('#')) {
                const level = line.match(/^#+/)[0].length;
                const content = line.replace(/^#+\s*/, '');
                html += `<h${level}>${mdInline(mdEscape(content))}</h${level}>`;
            } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                html += `<li>${mdInline(mdEscape(line.trim().substring(2)))}</li>`;
            } else {
                html += `<p>${mdInline(mdEscape(line))}</p>`;
            }
        });
        mdPreview.innerHTML = html || '<p><em>No content</em></p>';
    }

    window.applyInlineFormat = (kind) => {
        const start = mdTextarea.selectionStart ?? 0;
        const end = mdTextarea.selectionEnd ?? start;
        const before = mdTextarea.value.slice(0, start);
        const sel = mdTextarea.value.slice(start, end);
        const after = mdTextarea.value.slice(end);

        const wrap = (left, right) => {
            const newSel = sel || (kind === 'link' ? 'text' : '');
            const inserted = left + newSel + right;
            mdTextarea.value = before + inserted + after;
            const caretStart = before.length + left.length;
            const caretEnd = caretStart + newSel.length;
            mdTextarea.focus();
            mdTextarea.setSelectionRange(caretStart, caretEnd);
        };

        if (kind === 'bold') return wrap('**', '**');
        if (kind === 'italic') return wrap('*', '*');
        if (kind === 'code') return wrap('`', '`');
        if (kind === 'link') return wrap('[', '](https://example.com)');
    };

    if (mdToggleBtn) {
        mdToggleBtn.onclick = () => {
            if (mdTextarea.style.display === 'none') {
                mdTextarea.style.display = 'block';
                mdPreview.style.display = 'none';
                mdToggleBtn.textContent = 'Preview';
            } else {
                renderMarkdownPreview(mdTextarea.value);
                mdTextarea.style.display = 'none';
                mdPreview.style.display = 'block';
                mdToggleBtn.textContent = 'Edit';
            }
        };
    }

    function render(filtered) {
        cfList.innerHTML = '';
        if (filtered.length === 0) {
            cfList.innerHTML = '<div style="padding: 20px; text-align: center;">No problems found.</div>';
            return;
        }

        const solved = JSON.parse(localStorage.getItem('cf_solved') || '{}');
        const notes = JSON.parse(localStorage.getItem('cf_notes') || '{}');

        filtered.forEach(p => {
            const item = document.createElement('div');
            item.className = 'cf-problem-item';
            item.dataset.id = p.id;
            
            let status = 0;
            if (solved[p.id]) {
                if (solved[p.id] === true || solved[p.id].solved) status = 2;
                else if (solved[p.id].status !== undefined) status = solved[p.id].status;
            }

            const hasNote = notes[p.id] && notes[p.id].trim().length > 0;
            const contestIdMatch = p.id.match(/\d+/);
            const indexMatch = p.id.match(/[A-Z]+/);
            
            if (!contestIdMatch || !indexMatch) return;
            
            const url = `https://codeforces.com/problemset/problem/${contestIdMatch[0]}/${indexMatch[0]}`;

            item.innerHTML = `
                <div class="cf-problem-status">
                    <div class="cf-status-indicator status-${status}" onclick="openCFStatusPopup(event, '${p.id}')"></div>
                </div>
                <div class="cf-problem-main">
                    <a href="${url}" target="_blank" class="cf-problem-name">${p.id}. ${p.name}</a>
                    <div class="cf-problem-meta">
                        <span class="cf-problem-difficulty ${getDiffClass(p.rating)}">${p.rating}</span>
                        <span>${p.tags.join(', ')}</span>
                    </div>
                </div>
                <div class="cf-problem-actions">
                    ${hasNote ? `
                        <div class="note-icon has-note" onclick="openNoteEditor('${p.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                    ` : ''}
                </div>
            `;
            cfList.appendChild(item);
        });
    }

    window.openCFStatusPopup = (e, id) => {
        e.stopPropagation();
        currentPopupProblemId = id;
        
        const rect = e.target.getBoundingClientRect();
        statusPopup.style.top = `${window.scrollY + rect.top - 5}px`;
        statusPopup.style.left = `${window.scrollX + rect.right + 10}px`;
        
        statusPopup.classList.remove('hidden');
        setTimeout(() => statusPopup.classList.add('show'), 10);

        // Highlight active status in popup
        const solved = JSON.parse(localStorage.getItem('cf_solved') || '{}');
        let currentStatus = 0;
        if (solved[id]) {
            if (solved[id] === true || solved[id].solved) currentStatus = 2;
            else if (solved[id].status !== undefined) currentStatus = solved[id].status;
        }

        statusPopup.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.status) === currentStatus);
        });

        // Update note icon in popup
        const notes = JSON.parse(localStorage.getItem('cf_notes') || '{}');
        const hasNote = notes[id] && notes[id].trim().length > 0;
        notePopupBtn.classList.toggle('has-note', hasNote);
    };

    // Handle status selection from popup
    statusPopup.querySelectorAll('.status-btn').forEach(btn => {
        btn.onclick = () => {
            const status = parseInt(btn.dataset.status);
            setCFStatus(currentPopupProblemId, status);
            statusPopup.classList.remove('show');
            setTimeout(() => statusPopup.classList.add('hidden'), 200);
        };
    });

    notePopupBtn.onclick = () => {
        openNoteEditor(currentPopupProblemId);
        statusPopup.classList.remove('show');
        setTimeout(() => statusPopup.classList.add('hidden'), 200);
    };

    function setCFStatus(id, status) {
        const solved = JSON.parse(localStorage.getItem('cf_solved') || '{}');
        if (status === 0) {
            delete solved[id];
        } else {
            const problems = getAllProblems();
            const p = problems.find(prob => prob.id === id);
            solved[id] = {
                status: status,
                solved: status === 2,
                timestamp: new Date().toISOString(),
                name: p ? p.name : id
            };
        }
        localStorage.setItem('cf_solved', JSON.stringify(solved));
        filter();
    }

    // Global click listener to close popup
    document.addEventListener('click', (e) => {
        if (!statusPopup.contains(e.target)) {
            statusPopup.classList.remove('show');
            setTimeout(() => statusPopup.classList.add('hidden'), 200);
        }
    });

    window.openNoteEditor = (id) => {
        currentNoteId = id;
        const notes = JSON.parse(localStorage.getItem('cf_notes') || '{}');
        mdTextarea.value = notes[id] || '';
        mdTextarea.style.display = 'block';
        mdPreview.style.display = 'none';
        if (mdToggleBtn) mdToggleBtn.textContent = 'Preview';
        noteOverlay.style.display = 'flex';
        requestAnimationFrame(() => noteOverlay.classList.add('active'));
        mdTextarea.focus();
    };

    noteSaveBtn.onclick = () => {
        if (!currentNoteId) return;
        const notes = JSON.parse(localStorage.getItem('cf_notes') || '{}');
        const text = mdTextarea.value.trim();
        if (text) {
            notes[currentNoteId] = text;
        } else {
            delete notes[currentNoteId];
        }
        localStorage.setItem('cf_notes', JSON.stringify(notes));
        noteOverlay.classList.remove('active');
        setTimeout(() => {
            noteOverlay.style.display = 'none';
            filter();
        }, 150);
    };

    noteCloseBtn.onclick = () => {
        noteOverlay.classList.remove('active');
        setTimeout(() => noteOverlay.style.display = 'none', 150);
    };

    function filter() {
        const search = searchInput.value.toLowerCase();
        const diffRange = difficultySelect.value;
        const problems = getAllProblems();
        
        const filtered = problems.filter(p => {
            const matchesName = p.name.toLowerCase().includes(search);
            const matchesId = p.id.toLowerCase().includes(search);
            const matchesTags = p.tags.some(tag => tag.toLowerCase().includes(search));
            
            const matchesSearch = matchesName || matchesId || matchesTags;
            
            let matchesDiff = true;
            if (diffRange === '800-1200') matchesDiff = p.rating <= 1200;
            else if (diffRange === '1300-1600') matchesDiff = p.rating >= 1300 && p.rating <= 1600;
            else if (diffRange === '1700-2000') matchesDiff = p.rating >= 1700 && p.rating <= 2000;
            else if (diffRange === '2100+') matchesDiff = p.rating >= 2100;
            
            return matchesSearch && matchesDiff;
        });
        
        render(filtered);
    }

    // Add Problem Logic
    const addBtn = document.getElementById('add-cf-btn');
    const addId = document.getElementById('add-cf-id');
    const addName = document.getElementById('add-cf-name');
    const addRating = document.getElementById('add-cf-rating');
    const addTags = document.getElementById('add-cf-tags');

    addBtn.onclick = () => {
        const id = addId.value.trim().toUpperCase();
        const name = addName.value.trim();
        const rating = parseInt(addRating.value);
        const tags = addTags.value.split(',').map(t => t.trim()).filter(t => t.length);

        if (!id || !name || isNaN(rating)) {
            alert('Please fill ID, Name, and Rating');
            return;
        }

        const userProblems = JSON.parse(localStorage.getItem('cf_custom_problems') || '[]');
        userProblems.push({ id, name, rating, tags });
        localStorage.setItem('cf_custom_problems', JSON.stringify(userProblems));

        addId.value = '';
        addName.value = '';
        addRating.value = '';
        addTags.value = '';

        filter();
    };

    searchInput.addEventListener('input', filter);
    difficultySelect.addEventListener('change', filter);

    filter();

    const currentUsername = localStorage.getItem('username');
    if (currentUsername) {
        document.getElementById('welcome-message').textContent = `Welcome, ${currentUsername}`;
    }

    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('username');
        window.location.href = '/';
    };
});
