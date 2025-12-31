// SettingsTabBlacklist.js
// Module for "Чёрный список" tab. Contains blacklist UI and incremental fetch logic.
// Exposes: window.initSettingsTabBlacklist(container) and window.itdPlus_blacklist helpers

(function () {
    'use strict';
    const S = window.itdPlusShared;

    // Local module state
    let userCache = {}; // id -> info
    let fetchedUsers = S.loadFetchedUsers(); // cached fetched users [{id, name, username, avatar}]
    let fetchedHashtags = []; // cached hashtag objects
    let lastBlacklistUsersSnapshot = [];
    let lastBlacklistTagsSnapshot = [];

    // Helper: render users list in given target
    const renderUsers = (target, users, query = '') => {
        target.innerHTML = '';
        const filtered = users.filter(u =>
            u && ((u.username && u.username.toLowerCase().includes(query.toLowerCase())) ||
                  (u.name && u.name.toLowerCase().includes(query.toLowerCase())))
        );

        if (filtered.length === 0) {
            target.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--color-text-secondary);">${query ? 'Ничего не найдено' : 'Список пуст'}</div>`;
            return;
        }

        filtered.forEach((u, index) => {
            const id = u.id ? u.id.toString() : u.username;
            const list = S.getRawBlacklist();
            const isBlocked = list.includes(id);
            const btnText = isBlocked ? 'Убрать' : 'Вернуть';
            const btnClass = isBlocked ? 'following' : '';
            const rank = index + 1;
            const displayAvatar = u.avatar || S.emojis[index % S.emojis.length];

            const userHtml = `
                <div class="followers-modal__user svelte-13xi1sg" role="button" tabindex="0" data-id="${id}">
                    <div class="explore-hashtag__rank svelte-1w567vk">${rank}</div>
                    <div class="avatar avatar--emoji svelte-6nt8hx" style="width: 44px; height: 44px; font-size: 26.4px;">${displayAvatar}</div>
                    <div class="followers-modal__info svelte-13xi1sg">
                        <a href="/${u.username}" class="followers-modal__name svelte-1jqzo7p">${u.name}</a>
                        <span class="followers-modal__username svelte-13xi1sg">@${u.username}</span>
                    </div>
                    <button class="followers-modal__follow-btn svelte-13xi1sg ${btnClass}" data-action="toggle-bl">${btnText}</button>
                </div>
            `;
            target.insertAdjacentHTML('beforeend', userHtml);
        });

        // bind actions
        target.querySelectorAll('[data-action="toggle-bl"]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const row = btn.closest('.followers-modal__user');
                const id = row.dataset.id;
                let list = S.getRawBlacklist();
                if (list.includes(id)) {
                    list = list.filter(existingId => existingId !== id);
                    S.saveBlacklist(list);
                    btn.innerText = 'Вернуть';
                    btn.classList.remove('following');
                } else {
                    list.push(id);
                    S.saveBlacklist(list);
                    btn.innerText = 'Убрать';
                    btn.classList.add('following');
                }
                lastBlacklistUsersSnapshot = S.getRawBlacklist().map(String);
            };
        });
    };

    // ensure fetched users present for list (incremental fetch)
    const ensureFetchedUsers = async (list, target, query = '') => {
        const desired = list.map(String);
        // drop stale local cache
        fetchedUsers = fetchedUsers.filter(u => desired.includes(String(u.id)));

        const knownIds = new Set(fetchedUsers.map(u => String(u.id)));
        const missing = desired.filter(id => !knownIds.has(String(id)));

        if (missing.length === 0) {
            renderUsers(target, fetchedUsers, query);
            return;
        }

        for (let i = 0; i < missing.length; i++) {
            const id = missing[i];
            const info = await S.fetchUserInfo(id);
            fetchedUsers.push({ ...info, id });
            S.saveFetchedUsers(fetchedUsers);
            renderUsers(target, fetchedUsers, query);
            await new Promise(r => setTimeout(r, 400));
        }
    };

    // check for changes in users blacklist and update
    const checkForNewEntries = async (target, query = '') => {
        const list = S.getRawBlacklist().map(String);
        const snapshot = lastBlacklistUsersSnapshot.join('|');
        const current = list.join('|');
        if (snapshot === current) return;
        lastBlacklistUsersSnapshot = [...list];
        await ensureFetchedUsers(list, target, query);
    };

    // HASHTAGS
    const renderHashtags = (target, tagsData, query = '') => {
        target.innerHTML = '';
        const filtered = tagsData.filter(h => h && h.name && h.name.toLowerCase().includes(query.toLowerCase()));
        if (filtered.length === 0) {
            target.innerHTML = `<div style="padding:40px 24px; text-align:center; color:var(--color-text-secondary);">${query ? 'Ничего не найдено' : 'Список пуст'}</div>`;
            return;
        }
        filtered.forEach((h, index) => {
            const blkList = S.getRawHashBlacklist();
            const isBlocked = blkList.some(x => (x.name || '').toLowerCase() === h.name.toLowerCase());
            const btnText = isBlocked ? 'Убрать' : 'Вернуть';
            const btnClass = isBlocked ? 'following' : '';
            const cnt = h.postsCount || 0;
            const cntText = cnt > 0 ? (cnt > 999 ? (Math.round(cnt / 10) / 100) + ' тыс. постов' : `${cnt} постов`) : 'нет данных';

            const block = document.createElement('div');
            block.className = 'explore-hashtag svelte-1w567vk';

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '12px';

            const rank = document.createElement('div');
            rank.className = 'explore-hashtag__rank svelte-1w567vk';
            rank.textContent = (index + 1).toString();

            const info = document.createElement('div');
            info.className = 'explore-hashtag__info svelte-1w567vk';

            const tagLink = document.createElement('span');
            tagLink.className = 'explore-hashtag__name svelte-1w567vk';
            tagLink.style.cursor = 'pointer';
            tagLink.textContent = h.name;
            tagLink.onclick = () => { location.href = `${S.xnDomain}/hashtag/${encodeURIComponent(h.name.replace('#',''))}`; };

            const tagCount = document.createElement('span');
            tagCount.className = 'explore-hashtag__count svelte-1w567vk';
            tagCount.textContent = cntText;

            info.appendChild(tagLink);
            info.appendChild(tagCount);
            left.appendChild(rank);
            left.appendChild(info);

            const actBtn = document.createElement('button');
            actBtn.className = `followers-modal__follow-btn svelte-13xi1sg ${btnClass}`;
            actBtn.textContent = btnText;
            actBtn.onclick = (e) => {
                e.stopPropagation();
                let bl = S.getRawHashBlacklist();
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
        const desiredNames = tagsList.map(t => ((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase());
        fetchedHashtags = fetchedHashtags.filter(h => desiredNames.includes(h.name.toLowerCase()));
        const knownNames = new Set(fetchedHashtags.map(h => h.name.toLowerCase()));
        const missing = tagsList.filter(t => !knownNames.has(((t.name || '').startsWith('#') ? t.name : ('#' + t.name)).toLowerCase()));
        if (missing.length === 0) {
            renderHashtags(target, fetchedHashtags, query);
            return;
        }
        for (let i = 0; i < missing.length; i++) {
            const info = await S.fetchHashtagInfo(missing[i]);
            info.name = info.name.startsWith('#') ? info.name : ('#' + info.name);
            fetchedHashtags.push(info);
            renderHashtags(target, fetchedHashtags, query);
            await new Promise(r => setTimeout(r, 400));
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
            <div class="settings-modal__section svelte-1jqzo7p">
                <div class="notifications-tabs svelte-1ce0uvz itd-notifications-tabs">
                    <button class="notifications-tab svelte-1ce0uvz active" data-sub="users">Пользователи</button>
                    <button class="notifications-tab svelte-1ce0uvz" data-sub="tags">Хештеги</button>
                </div>
                <header class="explore-header svelte-1w567vk itd-explore-search">
                    <div class="explore-search svelte-1w567vk itd-explore-search">
                        <input type="text" placeholder="Поиск в черном списке..." class="explore-search__input svelte-1w567vk itd-explore-search__input" value="${filterQuery}">
                        <span class="explore-search__icon svelte-1w567vk">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="18" height="18">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="м19.5 19.5-3-3M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z"></path>
                            </svg>
                        </span>
                    </div>
                </header>
                <div style="color: var(--color-text-secondary);font-size: 14px;">
                    <div class="followers-modal__list svelte-13xi1sg" id="itd-bl-items"></div>
                </div>
            </div>
        `;

        const itemsContainer = container.querySelector('#itd-bl-items');
        const searchInput = container.querySelector('.explore-search__input.svelte-1w567vk.itd-explore-search__input');

        searchInput.oninput = (e) => {
            const q = e.target.value;
            const activeTab = container.querySelector('.notifications-tab.active').dataset.sub;
            if (activeTab === 'tags') {
                renderHashtags(itemsContainer, fetchedHashtags, q);
            } else {
                renderUsers(itemsContainer, fetchedUsers, q);
            }
        };

        container.querySelectorAll('[data-sub]').forEach(b => {
            b.onclick = async () => {
                container.querySelectorAll('.notifications-tab.svelte-1ce0uvz').forEach(x => x.classList.remove('active'));
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

        // initial: show users or tags based on stored data
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