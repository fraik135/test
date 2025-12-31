// SettingsTabUpdates.js
// Module for "Обновления" tab.
// Exposes: window.initSettingsTabUpdates(container)

(function () {
    'use strict';
    const S = window.itdPlusShared;

    window.initSettingsTabUpdates = async (container) => {
        container.innerHTML = `
            <div class="updateButton">
                <button class="original-post svelte-9y6twa">
                    <div class="updateHeader">
                        <div class="loader svelte-lrcio1"><svg class="loader__spinner svelte-lrcio1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle class="loader__track svelte-lrcio1" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle><path class="loader__arc svelte-lrcio1" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg></div>
                        <div class="original-post__info svelte-9y6twa"><span class="original-post__name svelte-9y6twa">Проверка обновления...</span></div>
                    </div>
                </button>
            </div>
        `;

        const currentVersion = '2.6';
        try {
            const res = await fetch('https://itdplusdb-default-rtdb.europe-west1.firebasedatabase.app/itd_version.json');
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();

            let wrapperStart = '<div class="updateButton"><button class="original-post svelte-9y6twa">';
            let wrapperEnd = '</button></div>';
            let iconSvg = '';
            let titleText = '';
            let metaText = `Версия v${currentVersion}`;

            const needsUpdate = data.version && data.version !== currentVersion && data.version > currentVersion;

            if (!needsUpdate) {
                iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="#00BA7C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="м4 12l6 6L20 6"></path></svg>';
                titleText = 'У вас установлена последняя версия расширения';
            } else {
                iconSvg = '<svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.4993 21.875V4.375M17.4993 21.875L11.666 16.0417M17.4993 21.875L23.3327 16.0417M2.91602 24.7917L3.82164 28.4156C3.97936 29.0466 4.34347 29.6068 4.85608 30.0071C5.36869 30.4074 6.0004 30.6249 6.65081 30.625H28.3464C28.9968 30.6249 29.6285 30.4074 30.1412 30.0071C30.6538 29.6068 31.0179 29.0466 31.1756 28.4156L32.0827 24.7917" stroke="#F59E0B" stroke-width="2.91667" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                titleText = 'Требуется обновление';

                if (data.downloadUrl) {
                    wrapperStart = `<div class="updateButton"><a href="${data.downloadUrl}" target="_blank" style="text-decoration:none;"><button class="original-post svelte-9y6twa">`;
                    wrapperEnd = '</button></a></div>';
                }
            }

            container.innerHTML = `
                ${wrapperStart}
                    <div class="updateHeader">
                        ${iconSvg}
                        <div class="original-post__info svelte-9y6twa">
                            <span class="original-post__name svelte-9y6twa">${titleText}</span>
                            <span class="original-post__meta svelte-9y6twa">${metaText}</span>
                        </div>
                    </div>
                ${wrapperEnd}
            `;
        } catch (e) {
            console.error('ITD+: Update check failed', e);
            container.innerHTML = `
                <div class="updateButton">
                    <button class="original-post svelte-9y6twa">
                        <div class="updateHeader">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px"><path fill="none" stroke="#ff4d4f" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12l6 6m-6 0l-6 6m6-6V4"/></svg>
                            <div class="original-post__info svelte-9y6twa">
                                <span class="original-post__name svelte-9y6twa">Ошибка проверки обновления</span>
                            </div>
                        </div>
                    </button>
                </div>
            `;
        }

        // plus the NotifyUpdates option
        const sectionUpdates = document.createElement('div');
        sectionUpdates.className = 'settings-modal__section svelte-1jqzo7p';
        sectionUpdates.innerHTML = `
            <div class="settings-modal__options svelte-1jqzo7p">
              ${S.createOptionHtml('NotifyUpdates', 'Уведомлять о новых обновлениях', '', '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5.365V3m0 2.365a5.34 5.34 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175c0 .593 0 1.193-.538 1.193H5.538c-.538 0-.538-.6-.538-1.193c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.34 5.34 0 0 1 12 5.365m-8.134 5.368a8.46 8.46 0 0 1 2.252-5.714m14.016 5.714a8.46 8.46 0 0 0-2.252-5.714M8.54 17.901a3.48 3.48 0 0 0 6.92 0z"></path>')}
            </div>
        `;
        container.appendChild(sectionUpdates);

        // bind toggles
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