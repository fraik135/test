// SettingsTabBlacklist.js
// Module for "Чёрный список" tab. Contains blacklist UI and incremental fetch logic.
// Изменён: убраны зависимости от svelte-классов, добавлены дедупликация и предотвращение дублей.
// Exposes: window.initSettingsTabBlacklist(container) and window.itdPlus_blacklist helpers

(function () {
    'use strict';
    const S = window.itdPlusShared;

    // Local module state
    let userCache = {}; // id -> info
    let fetchedUsers = (S.loadFetchedUsers() || []).map(u => ({ ...u, id: String(u.id) })); // cached fetched users [{id, name, username, avatar}]
    // ensure uniqueness on load
    (function dedupeOnStart() {
        const map = new Map();
        fetchedUsers.forEach(u => { if (u && u.id) map.set(String(u.id), u); });
        fetchedUsers = Array.from(map.values());
        S.saveFetchedUsers(fetchedUsers);
    })();

    let fetchedHashtags = []; // cached hashtag objects
    let lastBlacklistUsersSnapshot = [];
    let lastBlacklistTagsSnapshot = [];

    // Helper: render users list in given target
    const renderUsers = (target, users, query = '') => {
        target.innerHTML = '';

        // dedupe by id before render
        const map = new Map();
        users.forEach(u => { if (u && (u.id || u.username)) map.set(String(u.id || u.username), u); });
        const unique = Array.from(map.values());

        const filtered = unique.filter(u =>
            u && ((u.username && u.username.toLowerCase().includes(query.toLowerCase())) ||
                  (u.name && u.name.toLowerCase().includes(query.toLowerCase())))
        );

        if (filtered.length === 0) {
            target.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--color-text-secondary);">${query ? 'Ничего не найдено' : 'Список пуст'}</div>`;
            return;
        }

        filtered.forEach((u, index) => {
            const id = String(u.id || u.username);
            const list = S.getRawBlacklist().map(String);
            const isBlocked = list.includes(id);
            const btnText = isBlocked ? 'Убрать' : 'Вернуть';
            const btnClass = isBlocked ? 'following' : '';
            const rank = index + 1;
            const displayAvatar = u.avatar || S.emojis[index % S.emojis.length];

            const wrapper = document.createElement('div');
            wrapper.className = 'itd-bl-row';
            wrapper.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:28px;text-align:center;color:var(--color-text-secondary)">${rank}</div>
                    <div style="width:44px;height:44px;font-size:26.4px;display:flex;align-items:center;justify-content:center;">${displayAvatar}</div>
                    <div style="display:flex;flex-direction:column;">
                        <a href="/${u.username}" style="font-weight:700;color:var(--color-text);text-decoration:none;">${u.name}</a>
                        <span style="color:var(--color-text-secondary);">@${u.username}</span>
                    </div>
                </div>
                <div>
                    <button class="followers-modal__follow-btn ${btnClass}" data-action="toggle-bl" data-id="${id}">${btnText}</button>
                </div>
            `;
            // row container with flex justify
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px 12px';
            row.style.borderBottom = '1px solid var(--color-border)';
            row.appendChild(wrapper);
            target.appendChild(row);
        });

        // bind actions
        target.querySelectorAll('[data-action="toggle-bl"]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = String(btn.dataset.id);
                let list = S.getRawBlacklist().map(String);
                if (list.includes(id)) {
                    list = list.filter(existingId => existingId !== id);
                    S.saveBlacklist(list);
                    btn.innerText = 'Вернуть';
                    btn.classList.remove('following');
                } else {
                    // prevent duplicates
                    if (!list.includes(id)) {
                        list.push(id);
                        S.saveBlacklist(list);
                    }
                    btn.innerText = 'Убрать';
                    btn.classList.add('following');
                }
                // update cached fetchedUsers: remove stale if needed
                fetchedUsers = fetchedUsers.filter(u => list.includes(String(u.id)));
                S.saveFetchedUsers(fetchedUsers);
                lastBlacklistUsersSnapshot = S.getRawBlacklist().map(String);
            };
        });
    };

    // ensure fetched users present for list (incremental fetch)
    const ensureFetchedUsers = async (list, target, query = '') => {
        const desired = (list || []).map(String);
        // drop stale local cache
        fetchedUsers = fetchedUsers.filter(u => desired.includes(String(u.id)));

        const knownIds = new Set(fetchedUsers.map(u => String(u.id)));
        const missing = desired.filter(id => !knownIds.has(String(id)));

        if (missing.length === 0) {
            renderUsers(target, fetchedUsers, query);
            return;
        }

        for (let i = 0; i < missing.length; i++) {
            const id = String(missing[i]);
            // avoid double-fetch if fetchedUsers already contains id (race-safety)
            if (fetchedUsers.some(x => String(x.id) === id)) continue;
            const info = await S.fetchUserInfo(id);
            const entry = { ...info, id };
            // push only if not exists
            if (!fetchedUsers.some(x => String(x.id) === id)) {
                fetchedUsers.push(entry);
                // ensure unique
                const map = new Map();
                fetchedUsers.forEach(u => { if (u && u.id) map.set(String(u.id), u); });
                fetchedUsers = Array.from(map.values());
                S.saveFetchedUsers(fetchedUsers);
            }
            renderUsers(target, fetchedUsers, query);
            await new Promise(r => setTimeout(r, 300));
        }
    };

    // check for changes in users blacklist and update
    const checkForNewEntries = async (target, query = '') => {
        const list = (S.getRawBlacklist() || []).map(String);
        const snapshot = lastBlacklistUsersSnapshot.join('|');
        const current = list.join('|');
        if (snapshot === current) return;
        lastBlacklistUsersSnapshot = [...list];
        await ensureFetchedUsers(list, target, query);
    };

    // HASHTAGS
    const renderHashtags = (target, tagsData, query = '') => {
        target.innerHTML = '';
        // dedupe tags by normalized name
        const map = new Map();
        (tagsData || []).forEach(h => { if (h && h.name) map.set(String(h.name).toLowerCase(), h); });
        const unique = Array.from(map.values());

        const filtered = unique.filter(h => h && h.name && h.name.toLowerCase().includes(query.toLowerCase()));
        if (filtered.length === 0) {
            target.innerHTML = `<div style="padding:40px 24px; text-align:center; color:var(--color-text-secondary);">${query ? 'Ничего не найдено' : 'Список пуст'}</div>`;
            return;
        }
        filtered.forEach((h, index) => {
            const blkList = S.getRawHashBlacklist() || [];
            const isBlocked = blkList.some(x => (x.name || '').toLowerCase() === h.name.toLowerCase());
            const btnText = isBlocked ? 'Убрать' : 'Вернуть';
            const btnClass = isBlocked ? 'following' : '';
            const cnt = h.postsCount || 0;
            const cntText = cnt > 0 ? (cnt > 999 ? (Math.round(cnt / 10) / 100) + ' тыс. постов' : `${cnt} постов`) : 'нет данных';

            const block = document.createElement('div');
            block.style.display = 'flex';
            block.style.justifyContent = 'space-between';
            block.style.alignItems = 'center';
            block.style.padding = '8px 12px';
            block.style.borderBottom = '1px solid var(--color-border)';

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '12px';

            const rank = document.createElement('div');
            rank.style.width = '28px';
            rank.style.textAlign = 'center';
            rank.style.color = 'var(--color-text-secondary)';
            rank.textContent = (index + 1).toString();

            const info = document.createElement('div');
            info.style.display = 'flex';
            info.style.flexDirection = 'column';

            const tagLink = document.createElement('span');
            tagLink.style.cursor = 'pointer';
            tagLink.style.fontWeight = '700';
            tagLink.style.color = 'var(--color-text)';
            tagLink.textContent = h.name;
            tagLink.onclick = () => { location.href = `${S.xnDomain}/hashtag/${encodeURIComponent(h.name.replace('#',''))}`; };

            const tagCount = document.createElement('span');
            tagCount.style.fontSize = '13px';
            tagCount.style.color = 'var(--color-text-secondary)';
            tagCount.textContent = cntText;

            info.appendChild(tagLink);
            info.appendChild(tagCount);
            left.appendChild(rank);
            left.appendChild(info);

            const actBtn = document.createElement('button');
            actBtn.className = `followers-modal__follow-btn ${btnClass}`;
            actBtn.textContent = btnText;
            actBtn.onclick = (e) => {
                e.stopPropagation();
                let bl = S.getRawHashBlacklist() || [];
                const foundIndex = bl.findIndex(x => (x.name || '').toLowerCase() === h.name.toLowerCase());
                if (foundIndex !== -1) {
                    bl = bl.slice(0, foundIndex).concat(bl.slice(foundIndex + 1));
                } else {
                    bl.push({ id: h.id, name: h.name });
                }
                S.saveHashBlacklist(bl);
                const existingIdx = fetchedHashtags.findIndex(x => x.name.toLowerCase() === h.name.toLowerCase());
                if (foundIndex === -1 && existingIdx === -1) {
                    fetchedHashtags.push(h);
                } else if (foundIndex !== -1 && existingIdx !== -1) {
                    fetchedHashtags.splice(existingIdx, 1);
                }
                renderHashtags(target, fetchedHashtags, query);
                lastBlacklistTagsSnapshot = (S.getRawHashBlacklist() || []).map(t => ((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase());
            };

            block.appendChild(left);
            block.appendChild(actBtn);
            target.appendChild(block);
        });
    };

    const ensureFetchedHashtags = async (tagsList, target, query = '') => {
        const desiredNames = (tagsList || []).map(t => ((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase());
        fetchedHashtags = fetchedHashtags.filter(h => desiredNames.includes(h.name.toLowerCase()));
        const knownNames = new Set(fetchedHashtags.map(h => h.name.toLowerCase()));
        const missing = (tagsList || []).filter(t => !knownNames.has(((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase()));
        if (missing.length === 0) {
            renderHashtags(target, fetchedHashtags, query);
            return;
        }
        for (let i = 0; i < missing.length; i++) {
            const info = await S.fetchHashtagInfo(missing[i]);
            info.name = info.name.startsWith('#') ? info.name : ('#' + info.name);
            fetchedHashtags.push(info);
            renderHashtags(target, fetchedHashtags, query);
            await new Promise(r => setTimeout(r, 300));
        }
    };

    const checkForNewTagEntries = async (target, query = '') => {
        const list = S.getRawHashBlacklist() || [];
        const normalized = list.map(t => ((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase());
        const snapshot = lastBlacklistTagsSnapshot.join('|');
        const current = normalized.join('|');
        if (snapshot === current) return;
        lastBlacklistTagsSnapshot = [...normalized];
        await ensureFetchedHashtags(list, target, query);
    };

    // main render entrypoint for this tab
    window.initSettingsTabBlacklist = async (container, filterQuery = '') => {
        const list = S.getRawBlacklist();

        container.innerHTML = `
            <div class="settings-modal__section">
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <button class="itd-bl-tab itd-bl-tab-users active" data-sub="users">Пользователи</button>
                    <button class="itd-bl-tab" data-sub="tags">Хештеги</button>
                </div>
                <div class="itd-bl-search" style="margin-bottom:12px;">
                    <input type="text" placeholder="Поиск в черном списке..." class="itd-bl-input" value="${filterQuery}">
                </div>
                <div style="color: var(--color-text-secondary);font-size: 14px;">
                    <div id="itd-bl-items"></div>
                </div>
            </div>
        `;

        const itemsContainer = container.querySelector('#itd-bl-items');
        const searchInput = container.querySelector('.itd-bl-input');

        // fully decoupled search -> only affects local render
        searchInput.oninput = (e) => {
            const q = e.target.value;
            const activeTab = container.querySelector('.itd-bl-tab.active').dataset.sub;
            if (activeTab === 'tags') {
                renderHashtags(itemsContainer, fetchedHashtags, q);
            } else {
                renderUsers(itemsContainer, fetchedUsers, q);
            }
        };

        // fully decoupled tabs (no svelte)
        container.querySelectorAll('.itd-bl-tab').forEach(b => {
            b.onclick = async () => {
                container.querySelectorAll('.itd-bl-tab').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                searchInput.value = '';
                if (b.dataset.sub === 'tags') {
                    const tagList = S.getRawHashBlacklist();
                    if (!tagList || tagList.length === 0) {
                        itemsContainer.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--color-text-secondary);">Список пуст</div>`;
                        return;
                    }
                    await ensureFetchedHashtags(tagList, itemsContainer, '');
                } else {
                    const listU = S.getRawBlacklist();
                    if (!listU || listU.length === 0) {
                        itemsContainer.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--color-text-secondary);">Список пуст</div>`;
                        return;
                    }
                    await ensureFetchedUsers(listU, itemsContainer, '');
                }
            };
        });

        // initial render (defaults to users)
        if ((S.getRawBlacklist() || []).length === 0) {
            itemsContainer.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--color-text-secondary);">Список пуст</div>`;
        } else {
            await ensureFetchedUsers(S.getRawBlacklist(), itemsContainer, filterQuery);
        }
    };

    // Export small API for monitor to call incremental checks
    window.itdPlus_blacklist = {
        checkForNewEntries,
        checkForNewTagEntries,
        ensureFetchedUsers,
        ensureFetchedHashtags
    };
})();
