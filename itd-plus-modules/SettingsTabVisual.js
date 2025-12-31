// SettingsTabVisual.js
// Module for "Внешний вид" tab (visual/theme settings).
// Exposes: window.initSettingsTabVisual(container)

(function () {
    'use strict';
    const S = window.itdPlusShared;

    window.initSettingsTabVisual = (container) => {
        container.innerHTML = `
            <div class="settings-modal__section svelte-1jqzo7p" id="visual-content">
                <h3 class="settings-modal__section-title svelte-1jqzo7p itd-content-dop">Тема оформления</h3>
                <div class="settings-modal__options svelte-1jqzo7p">
                    ${S.createSubMenuOption('themes', 'Выбрать тему', 'Темы оформления, созданные нами и аудиторией.', '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 1 21 12.79z"></path>')}
                    <h3 class="settings-modal__section-title svelte-1jqzo7p itd-content-dop">Уровень скругления</h3>
                    <div style="padding: 1rem 2rem;"><div class="slider-wrapper">
                        <input type="range" id="roundingSlider" min="0" max="50" value="${S.defaults.roundingLevel}" step="1" style="--value: 40%;">
                        <div class="slider-value" id="valueDisplay">${S.defaults.roundingLevel} px</div>
                    </div></div>
                    <div style="display: flex;gap: 20px;background-color: #0f1113;padding: 1rem 2rem;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <div style="flex: 1;">
                            <label style="font-size: .875rem; font-weight: 600; color: var(--color-text-secondary);">Стиль эмодзи</label>
                            <div style="position: relative; margin-top: 12px;">
                                <select id="emojiSelect" style="width: 100%; appearance: none; background-color: #16191c; color: #ffffff; border: 1px solid #202428; border-radius: 14px; padding: 16px 20px; font-size: 15px; outline: none; cursor: pointer;">
                                    <option value="Apple">Apple</option>
                                    <option value="Win11">Windows 11</option>
                                    <option value="Google">Google</option>
                                    <option value="Twitter">Twitter</option>
                                </select>
                                <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ba3af; display: flex; align-items: center;">
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: .875rem; font-weight: 600; color: var(--color-text-secondary);">Пользовательский шрифт</label>
                            <div style="position: relative; margin-top: 12px;">
                                <select id="fontSelect" style="width: 100%; appearance: none; background-color: #16191c; color: #ffffff; border: 1px solid #202428; border-radius: 14px; padding: 16px 20px; font-size: 15px; outline: none; cursor: pointer;">
                                    <option value="Inter">Inter</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="System">System UI</option>
                                </select>
                                <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ba3af; display: flex; align-items: center;">
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${S.createOptionHtml('garlandHeader', 'Гирлянда в шапке сайта', '', '<path d="M12 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')}
                    ${S.createOptionHtml('snow', 'Снег', '', '<path d="M12 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')}
                    ${S.createOptionHtml('newYearLogo', 'Новогодний логотип', '', '<path d="M12 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')}
                </div>
            </div>
        `;

        // append
        container.appendChild(container.firstElementChild);

        // slider logic
        const slider = container.querySelector('#roundingSlider');
        const output = container.querySelector('#valueDisplay');
        if (slider && output) {
            function updateSlider() {
                const val = slider.value;
                output.innerHTML = val + ' px';
                const min = slider.min;
                const max = slider.max;
                const percent = (val - min) / (max - min) * 100;
                slider.style.setProperty('--value', percent + '%');
                const s = S.getSettings();
                s.roundingLevel = Number(val);
                localStorage.setItem(S.SETTINGS_KEY, JSON.stringify(s));
            }
            slider.addEventListener('input', updateSlider);
            updateSlider();
        }

        // selects
        const emojiSelect = container.querySelector('#emojiSelect');
        const fontSelect = container.querySelector('#fontSelect');
        const cur = S.getSettings();
        if (emojiSelect) emojiSelect.value = cur.emojiStyle || 'Apple';
        if (fontSelect) fontSelect.value = cur.fontFamily || 'Inter';

        if (emojiSelect) emojiSelect.onchange = () => {
            const s = S.getSettings();
            s.emojiStyle = emojiSelect.value;
            localStorage.setItem(S.SETTINGS_KEY, JSON.stringify(s));
        };
        if (fontSelect) fontSelect.onchange = () => {
            const s = S.getSettings();
            s.fontFamily = fontSelect.value;
            localStorage.setItem(S.SETTINGS_KEY, JSON.stringify(s));
        };

        // sub-menu Themes click
        const themesBtn = container.querySelector('[data-sub="themes"]');
        if (themesBtn) {
            themesBtn.onclick = () => {
                // lazy load submodule UI — for now render simple placeholder and allow going back
                container.innerHTML = `
                    <div class="settings-modal__section svelte-1jqzo7p">
                        <div class="sub-tab-back" id="backBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            Назад
                        </div>
                        <h3 class="settings-modal__section-title svelte-1jqzo7p itd-content-dop">Темы</h3>
                        <div class="settings-modal__options svelte-1jqzo7p">
                            <div style="color: var(--color-text-secondary);font-size: 14px;">
                                <div class="followers-modal__list svelte-13xi1sg" id="itd-bl-items"><div style="padding: 20% 24px; text-align: center; color: var(--color-text-secondary);">Кастомизированные темы появятся в будущем.</div></div>
                            </div>
                        </div>
                    </div>
                `;
                container.querySelector('#backBtn').onclick = () => {
                    window.initSettingsTabVisual(container);
                };
            };
        }

        // toggles for options in the visual tab
        container.querySelectorAll('.settings-modal__option--toggle').forEach(opt => {
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