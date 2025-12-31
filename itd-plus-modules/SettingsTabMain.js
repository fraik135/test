// SettingsTabMain.js
// Module responsible for the "Основные" tab (Main options).
// Exposes: window.initSettingsTabMain(container)

(function () {
    'use strict';
    const S = window.itdPlusShared;

    window.initSettingsTabMain = (container) => {
        container.innerHTML = '';
        const sectionFeed = document.createElement('div');
        sectionFeed.className = 'settings-modal__section svelte-1jqzo7p';
        sectionFeed.innerHTML = `
            <h3 class="settings-modal__section-title svelte-1jqzo7p itd-content-dop">Лента</h3>
            <div class="settings-modal__options svelte-1jqzo7p">
                ${S.createOptionHtml('hideFirstDay', 'Скрыть посты "первого дня"', 'Скрыть посты, которые зависли в ленте рекомендаций', '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M4.93018 4.92969L19.0702 19.0697"/>')}
                ${S.createOptionHtml('hideWhoToFollow', 'Скрыть блок "кого читать"', '', '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M4.93018 4.92969L19.0702 19.0697"/>')}
                ${S.createOptionHtml('hideReposts', 'Скрыть репосты', '', '<path d="M2 9L5 6L8 9" stroke="#6A6F76" stroke-width="2"/><path d="M13 18H7C6.46957 18 5.96086 17.7893 5.58579 17.4142C5.21071 17.0391 5 16.5304 5 16V6M22 15L19 18L16 15"/><path d="M11 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V18"/>')}
            </div>
        `;

        const sectionProfile = document.createElement('div');
        sectionProfile.className = 'settings-modal__section svelte-1jqzo7p';
        sectionProfile.innerHTML = `
            <h3 class="settings-modal__section-title svelte-1jqzo7p itd-content-dop">Профиль</h3>
            <div class="settings-modal__options svelte-1jqzo7p">
                ${S.createOptionHtml('fullBanner', 'Полный размер шапки', 'Шапка в профиле не будет обрезаться по высоте', '<path d="M13.5 7C13.7761 7 14 6.77614 14 6.5C14 6.22386 13.7761 6 13.5 6C13.2239 6 13 6.22386 13 6.5C13 6.77614 13.2239 7 13.5 7Z"/><path d="M17.5 11C17.7761 11 18 10.7761 18 10.5C18 10.2239 17.7761 10 17.5 10C17.2239 10 17 10.2239 17 10.5C17 10.7761 17.2239 11 17.5 11Z"/><path d="M8.5 8C8.77614 8 9 7.77614 9 7.5C9 7.22386 8.77614 7 8.5 7C8.22386 7 8 7.22386 8 7.5C8 7.77614 8.22386 8 8.5 8Z"/><path d="M6.5 13C6.77614 13 7 12.7761 7 12.5C7 12.2239 6.77614 12 6.5 12C6.22386 12 6 12.2239 6 12.5C6 12.7761 6.22386 13 6.5 13Z"/><path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C12.926 22 13.648 21.254 13.648 20.312C13.648 19.875 13.468 19.477 13.211 19.187C12.921 18.898 12.773 18.535 12.773 18.062C12.7692 17.8419 12.8098 17.6233 12.8922 17.4192C12.9747 17.2151 13.0975 17.0298 13.2531 16.8741C13.4088 16.7185 13.5941 16.5957 13.7982 16.5132C14.0023 16.4308 14.2209 16.3902 14.441 16.394H16.437C19.488 16.394 21.992 13.891 21.992 10.839C21.965 6.012 17.461 2 12 2Z"/>')}
                ${S.createOptionHtml('silentMode', 'Невидимка', 'Вместо точного времени последнего онлайна будет “был(а) недавно”', '<path d="M6.873 17.129c-1.845-1.31-3.305-3.014-4.13-4.09a1.69 1.69 0 0 1 0-2.077C4.236 9.013 7.818 5 12 5c1.876 0 3.63 .807 5.13 1.874"></path><path d="M14.13 9.887a3 3 0 1 0-4.243 4.242M4 20L20 4M10 18.704A7.1 7.1 0 0 0 12 19c4.182 0 7.764-4.013 9.257-5.962a1.694 1.694 0 0 0-.001-2.078A23 23 0 0 0 19.57 9"></path>')}
                ${S.createOptionHtml('removeNickname', 'Видеть удаленные посты', 'Посты тех, на кого вы подписаны останутся у вас даже после удаления', '<path d="M4 6h16l-1.58 14.22A2 2 0 0 1 16.432 22H7.568a2 2 0 0 1-1.988-1.78zm3.345-2.853A2 2 0 0 1 9.154 2h5.692a2 2 0 0 1 1.81 1.147L18 6H6zM2 6h20m-12 5v5m4-5v5" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>')}
            </div>
        `;

        container.appendChild(sectionFeed);
        container.appendChild(sectionProfile);

        // attach handlers for toggles (uses local storage via shared getSettings)
        container.querySelectorAll('.settings-modal__option').forEach(opt => {
            opt.onclick = () => {
                const key = opt.dataset.key;
                if (!key) return;
                const btn = opt.querySelector('.settings-modal__toggle');
                const s = S.getSettings();
                s[key] = !s[key];
                localStorage.setItem(S.SETTINGS_KEY, JSON.stringify(s));
                if (btn) {
                    btn.classList.toggle('active');
                    btn.setAttribute('aria-pressed', s[key]);
                }
            };
        });
    };
})();