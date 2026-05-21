// ==================================================
// 初期設定
// ==================================================
const supabaseUrl = 'https://suxctlekjekdcpajhywk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1eGN0bGVramVrZGNwYWpoeXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjMwMDEsImV4cCI6MjA5NDkzOTAwMX0.Vt1DfIPndLcRzW8tkSOWpbDUVksKlQxA5Tftfd9IvlY';
if (typeof window.supabase === 'undefined') {
    console.error('Supabaseライブラリが読み込まれていません。');
} else {
    var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase接続成功');
}

// ==================================================
// DOM要素
// ==================================================
const hamburgerBtn        = document.getElementById('hamburger-btn');
const megaMenu            = document.getElementById('mega-menu');
const industryGrid        = document.getElementById('industry-grid');
const subNav              = document.getElementById('sub-nav');
const industryHomeContent = document.getElementById('industry-home-content');
const newsContent         = document.getElementById('news-content');
const tcjhgContent        = document.getElementById('tcjhg-content');
const currentIndustryLabel = document.getElementById('current-industry-label');

// ==================================================
// 状態管理
// ==================================================
let currentIndustry = '自動車';

// ==================================================
// 初期化
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    loadIndustryData(currentIndustry);
});

// ==================================================
// ハンバーガーメニュー
// ==================================================
hamburgerBtn.addEventListener('click', () => {
    megaMenu.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
});

// ==================================================
// 業界選択
// ==================================================
industryGrid.addEventListener('click', (event) => {
    const btn = event.target.closest('.industry-btn');
    if (!btn) return;

    currentIndustry = btn.dataset.industry;
    document.querySelectorAll('.industry-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (currentIndustryLabel) currentIndustryLabel.textContent = currentIndustry;

    loadIndustryData(currentIndustry);
    megaMenu.classList.remove('active');
    hamburgerBtn.classList.remove('active');
});

// ==================================================
// サブナビ
// ==================================================
subNav.addEventListener('click', (event) => {
    const tab = event.target.closest('.sub-nav-tab');
    if (tab) handleSubNavClick(tab);
});

// ==================================================
// 業界データ読み込み
// ==================================================
async function loadIndustryData(industry) {
    hideAllContent();
    await loadSubNavTabs(industry);

    const homeTab = subNav.querySelector('.sub-nav-tab[data-category="home"]');
    if (homeTab) handleSubNavClick(homeTab);
}

function hideAllContent() {
    industryHomeContent.style.display = 'none';
    newsContent.style.display = 'none';
    tcjhgContent.style.display = 'none';
}

// ==================================================
// サブナビタブ生成
// ==================================================
async function loadSubNavTabs(industry) {
    subNav.innerHTML = '<p style="padding:.9rem 1rem;font-size:.8rem;color:var(--text-muted)">読み込み中...</p>';

    try {
        const { data, error } = await supabase
            .from('keywords')
            .select('l1_category')
            .eq('industry', industry);

        if (error) throw error;

        const categories = [...new Set((data || []).map(item => item.l1_category))];
        subNav.innerHTML = '';

        subNav.appendChild(createTab('🏠 ホーム', 'home', true));
        categories.forEach(cat => subNav.appendChild(createTab(cat, cat, false)));
        subNav.appendChild(createTab('天地人彼我', 'tcjhg', false));

    } catch (error) {
        console.error('タブ読み込みエラー:', error);
        subNav.innerHTML = `<p class="error-message" style="padding:.9rem 1rem">カテゴリ取得に失敗しました。</p>`;
    }
}

function createTab(label, category, isActive) {
    const tab = document.createElement('button');
    tab.className = 'sub-nav-tab' + (isActive ? ' active' : '');
    tab.textContent = label;
    tab.dataset.category = category;
    return tab;
}

// ==================================================
// サブナビクリック
// ==================================================
function handleSubNavClick(tab) {
    document.querySelectorAll('.sub-nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const category = tab.dataset.category;
    hideAllContent();

    if (category === 'home') {
        industryHomeContent.style.display = 'block';
        updateHomeTitles();
        loadHomeNews(currentIndustry);
    } else if (category === 'tcjhg') {
        tcjhgContent.style.display = 'block';
    } else {
        newsContent.style.display = 'block';
        loadNewsForCategory(currentIndustry, category);
    }
}

// ==================================================
// ホームタイトル更新
// ==================================================
function updateHomeTitles() {
    const titleEl = document.getElementById('home-trend-title');
    if (titleEl) titleEl.textContent = `${currentIndustry}業界 トレンドサマリー`;
}

// ==================================================
// ホーム：カテゴリ別最新ニュース
// ==================================================
async function loadHomeNews(industry) {
    const grid = document.getElementById('home-news-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:1rem 0;">読み込み中...</p>';

    try {
        // カテゴリ一覧取得
        const { data: kwData, error: kwError } = await supabase
            .from('keywords')
            .select('l1_category')
            .eq('industry', industry);

        if (kwError) throw kwError;

        const categories = [...new Set((kwData || []).map(item => item.l1_category))];

        // 全ニュース取得（業界フィルター）
        const { data: newsData, error: newsError } = await supabase
            .from('news')
            .select('*')
            .eq('industry', industry)
            .order('published_date', { ascending: false });

        if (newsError) throw newsError;

        if (!newsData || newsData.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;grid-column:1/-1">ニュースがまだ登録されていません。</p>';
            return;
        }

        // カテゴリ別に分類
        grid.innerHTML = '';
        categories.forEach(cat => {
            const catNews = newsData.filter(n => n.l1_category === cat).slice(0, 3);
            const section = document.createElement('div');
            section.className = 'home-news-category';

            const header = `
                <div class="home-news-category-header">
                    <span class="home-news-category-name">${cat}</span>
                    <span class="home-news-category-count">${catNews.length} 件</span>
                </div>`;

            const items = catNews.length > 0
                ? catNews.map(article => `
                    <div class="home-news-item" onclick="navigateToCategory('${cat}')">
                        <div class="home-news-item-title">${article.title}</div>
                        <div class="home-news-item-meta">
                            <span>${formatDate(article.published_date)}</span>
                            <span>${article.source}</span>
                        </div>
                    </div>`).join('')
                : '<div class="home-news-empty">ニュースなし</div>';

            section.innerHTML = header + items;
            grid.appendChild(section);
        });

    } catch (error) {
        console.error('ホームニュース読み込みエラー:', error);
        grid.innerHTML = `<p class="error-message" style="grid-column:1/-1">エラー: ${error.message}</p>`;
    }
}

// カテゴリタブへ遷移
function navigateToCategory(category) {
    const tab = subNav.querySelector(`.sub-nav-tab[data-category="${category}"]`);
    if (tab) handleSubNavClick(tab);
}

// ==================================================
// カテゴリ別ニュース
// ==================================================
async function loadNewsForCategory(industry, category) {
    const newsSummary = newsContent.querySelector('#news-summary');
    const newsList    = newsContent.querySelector('#news-list');

    if (newsSummary) newsSummary.innerHTML = '<p style="color:var(--text-muted);font-size:.9rem;padding:1rem 0">読み込み中...</p>';
    if (newsList)    newsList.innerHTML    = '<p style="color:var(--text-muted);font-size:.9rem;padding:1rem 0">記事一覧を読み込み中...</p>';

    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('industry', industry)
            .eq('l1_category', category)
            .order('published_date', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (newsSummary) {
            newsSummary.innerHTML = `
                <div class="card-label">TREND SUMMARY — ${category}</div>
                <h2 class="card-title">「${category}」トレンドサマリー</h2>
                ${data && data.length > 0
                    ? `<div class="summary-box">
                           <p class="summary-text">「${category}」分野では、${getLatestTrend(data)}といった動きが注目されています。</p>
                           <p class="summary-note">// AI要約機能は次のフェーズで実装予定</p>
                       </div>`
                    : '<p class="card-body">このカテゴリのニュースはありません。</p>'
                }`;
        }

        if (newsList) {
            if (data && data.length > 0) {
                newsList.innerHTML = `
                    <div class="card-label">ARTICLES — ${data.length} items</div>
                    <div class="news-grid">
                        ${data.map(article => `
                            <article class="news-item">
                                <h3 class="news-title">${article.title}</h3>
                                <p class="news-content">${article.summary ? article.summary.substring(0, 200) + '...' : '詳細はリンク先をご覧ください。'}</p>
                                <div class="news-meta">
                                    <span>${formatDate(article.published_date)}</span>
                                    <span>${article.source}</span>
                                    ${article.l2_category ? `<span class="news-tag">${article.l2_category}</span>` : ''}
                                </div>
                                ${article.url ? `<a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">記事を読む →</a>` : ''}
                            </article>`).join('')}
                    </div>`;
            } else {
                newsList.innerHTML = `
                    <div class="empty-state">
                        <p>「${category}」に関するニュースはありません。</p>
                    </div>`;
            }
        }
    } catch (error) {
        console.error('ニュース読み込みエラー:', error);
        if (newsList) newsList.innerHTML = `<p class="error-message">エラー: ${error.message}</p>`;
    }
}

// ==================================================
// ユーティリティ
// ==================================================
function formatDate(dateString) {
    if (!dateString) return '日付不明';
    const d = new Date(dateString);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function getLatestTrend(newsData) {
    if (!newsData || newsData.length === 0) return '特筆すべき動向はありません';
    const keywords = (newsData[0].title.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]+/g) || []);
    return keywords.length > 0 ? keywords.slice(0, 3).join('、') : '最新の技術動向';
}

// ==================================================
// 天地人彼我 分析
// ==================================================
const SYSTEM_PROMPT = `あなたはIDAJ（株式会社アイダック）の営業支援AIです。
以下のルールを厳守してください：
- ソフトウェア・ツール名は絶対に書かない（「できること」で表現する）
- 公開情報のみを使用する
- スライドタイトルは「問い」の形式にする
- スライド下部の帯は「結論（答え）」にする
- 対象役職に応じて粒度を変える
  - 課長級：技術・収益の観点
  - 部長以上：ヒト・モノ・カネ・会社の存在意義の観点
- 必ずJSON形式のみで返答する。前置き・説明文は一切不要。`;

const PROMPTS = {
    ten: (info) => `以下の企業の「天（外部環境・市場背景）」を分析してください。Web検索で最新情報を取得して回答してください。
企業情報：企業名：${info.company}、業界：${info.industry}、担当部署：${info.dept}、担当者役職：${info.role}
以下のJSON形式のみで返答してください：{"title":"（問いの形式）","points":["重要ポイントを3〜5個、各100文字程度"],"obi":"（結論を1文で）"}`,

    chi: (info) => `以下の企業の「地（自社ポジション）」を分析してください。Web検索でIR・中期経営計画を調査して回答してください。
企業情報：企業名：${info.company}、業界：${info.industry}、担当部署：${info.dept}
以下のJSON形式のみで返答してください：{"title":"（問いの形式）","points":["市場シェア・技術成熟度・収益構造などを3〜5個"],"obi":"（結論を1文で）"}`,

    jin: (info) => `以下の企業の「人（リソース・強み）」を分析してください。Web検索で採用ページ・IRを調査して回答してください。
企業情報：企業名：${info.company}、業界：${info.industry}、担当部署：${info.dept}
以下のJSON形式のみで返答してください：{"title":"（問いの形式）","points":["ノウハウ・組織文化・パートナー関係などを3〜5個"],"obi":"（結論を1文で）"}`,

    hi: (info) => `以下の企業の「彼（競合動向）」を分析してください。Web検索で競合他社の最新動向を調査して回答してください。
企業情報：企業名：${info.company}、業界：${info.industry}
以下のJSON形式のみで返答してください：{"title":"（問いの形式）","points":["競合のスピード感・投資状況・新規参入などを3〜5個"],"obi":"（結論を1文で）"}`,

    ga: (info) => `以下の顧客情報をもとに、IDAJが提案できる内容を生成してください。https://idaj.co.jp/case/ の公開事例を参考にしてください。
顧客情報：企業名：${info.company}、業界：${info.industry}、部署：${info.dept}、役職：${info.role}、現状：${info.asis}、理想：${info.tobe}、課題：${info.memo}
以下のJSON形式のみで返答してください：{"title":"（問いの形式）","themes":[{"theme":"提案テーマ名","elements":["必要な要素2〜3個"],"support":["IDAJの支援2〜3個"]}],"obi":"（結論を1文で）"}`
};

async function callAnalyzeAPI(element, info) {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            element,
            systemPrompt: SYSTEM_PROMPT,
            userPrompt: PROMPTS[element](info)
        })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

async function runTcjhgAnalysis() {
    const info = {
        company:  document.getElementById('input-company').value.trim(),
        industry: document.getElementById('input-industry-text').value.trim(),
        dept:     document.getElementById('input-dept').value.trim(),
        role:     document.getElementById('input-role').value.trim(),
        asis:     document.getElementById('input-asis').value.trim(),
        tobe:     document.getElementById('input-tobe').value.trim(),
        memo:     document.getElementById('input-memo').value.trim(),
    };

    if (!info.company) { alert('企業名を入力してください。'); return; }

    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-analyze-text">分析中...</span>';

    showResultPanel(info.company);

    const elements = ['ten', 'chi', 'jin', 'hi', 'ga'];
    await Promise.all(elements.map(el =>
        callAnalyzeAPI(el, info)
            .then(data => updateResultTab(el, data.result))
            .catch(err => updateResultTab(el, { error: err.message }))
    ));

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-analyze-text">天地人彼我 を分析する</span><span class="btn-analyze-arrow">→</span>';
    await saveAnalysis(info, window._tcjhgResults || {});
}

function showResultPanel(company) {
    window._tcjhgResults = {};
    const existing = document.getElementById('tcjhg-result-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'tcjhg-result-panel';
    panel.className = 'card tcjhg-result-panel';
    panel.innerHTML = `
        <div class="card-label">ANALYSIS RESULT — ${company}</div>
        <div class="tcjhg-result-tabs">
            <button class="tcjhg-tab active" data-el="ten">天</button>
            <button class="tcjhg-tab" data-el="chi">地</button>
            <button class="tcjhg-tab" data-el="jin">人</button>
            <button class="tcjhg-tab" data-el="hi">彼</button>
            <button class="tcjhg-tab" data-el="ga">我</button>
        </div>
        <div id="tcjhg-result-body" class="tcjhg-result-body">
            <div class="tcjhg-loading">
                <span class="tcjhg-loading-dot"></span>
                <span class="tcjhg-loading-dot"></span>
                <span class="tcjhg-loading-dot"></span>
                <span style="margin-left:.5rem;font-size:.85rem;color:var(--text-muted)">分析中...</span>
            </div>
        </div>`;

    panel.querySelectorAll('.tcjhg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.tcjhg-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderResultBody(tab.dataset.el);
        });
    });

    tcjhgContent.appendChild(panel);
}

function updateResultTab(element, result) {
    if (!window._tcjhgResults) window._tcjhgResults = {};
    window._tcjhgResults[element] = result;
    const activeTab = document.querySelector('.tcjhg-tab.active');
    if (activeTab && activeTab.dataset.el === element) renderResultBody(element);
    const tab = document.querySelector(`.tcjhg-tab[data-el="${element}"]`);
    if (tab && !result.error) tab.classList.add('done');
}

function renderResultBody(element) {
    const body = document.getElementById('tcjhg-result-body');
    if (!body) return;
    const result = window._tcjhgResults?.[element];
    if (!result) {
        body.innerHTML = `<div class="tcjhg-loading"><span class="tcjhg-loading-dot"></span><span class="tcjhg-loading-dot"></span><span class="tcjhg-loading-dot"></span><span style="margin-left:.5rem;font-size:.85rem;color:var(--text-muted)">分析中...</span></div>`;
        return;
    }
    if (result.error) { body.innerHTML = `<p class="error-message">エラー: ${result.error}</p>`; return; }

    const labels = { ten:'天 — 外部環境', chi:'地 — ポジション', jin:'人 — リソース', hi:'彼 — 競合', ga:'我 — 提案' };
    let html = `<div class="result-label">${labels[element]}</div><h3 class="result-title">${result.title || ''}</h3>`;

    if (element === 'ga' && result.themes) {
        html += result.themes.map(t => `
            <div class="result-theme">
                <div class="result-theme-name">${t.theme}</div>
                <div class="result-theme-row">
                    <div><div class="result-sub-label">必要な要素</div><ul>${(t.elements||[]).map(e=>`<li>${e}</li>`).join('')}</ul></div>
                    <div><div class="result-sub-label">IDAJの支援</div><ul>${(t.support||[]).map(s=>`<li>${s}</li>`).join('')}</ul></div>
                </div>
            </div>`).join('');
    } else {
        html += `<ul class="result-points">${(result.points||[]).map(p=>`<li>${p}</li>`).join('')}</ul>`;
    }
    html += `<div class="result-obi">${result.obi || ''}</div>`;
    body.innerHTML = html;
}

async function saveAnalysis(info, results) {
    try {
        await supabase.from('analyses').insert([{
            company: info.company, industry: info.industry, dept: info.dept,
            role: info.role, asis: info.asis, tobe: info.tobe, memo: info.memo,
            ten: results.ten||null, chi: results.chi||null, jin: results.jin||null,
            hi: results.hi||null, ga: results.ga||null,
        }]);
        console.log('分析結果を保存しました');
    } catch (err) { console.error('保存エラー:', err); }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-analyze');
    if (btn) btn.addEventListener('click', runTcjhgAnalysis);
});