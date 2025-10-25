// Supabaseのクライアントライブラリをインポート
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 1. Supabaseの接続情報を設定
const SUPABASE_URL = 'https://ysirljcuwllpipwombik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaXJsamN1d2xscGlwd29tYmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTgyMTcsImV4cCI6MjA3NjkzNDIxN30.dru92CWrTVs7imZ9FpERnfXFES_HHhAgfKm8ueOjYLk';

// Supabaseクライアントを作成
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

// 2. HTMLの要素を取得
const newsFeed = document.getElementById('news-feed');
const trendsSummary = document.getElementById('industry-trends');

// 3. ニュースデータを取得して表示する関数
async function loadNews() {
    // まずはローディング表示に書き換える
    const newsContainer = newsFeed.querySelector('h2'); // h2の下に記事を追加していく
    newsContainer.innerHTML = '<h2>最新ニュース (データ取得中...)</h2>';

    // Supabaseの'news'テーブルからデータを取得
    const { data, error } = await supabase
        .from('news')
        .select('*') // すべての列を選択
        .order('published_at', { ascending: false }); // published_atで降順（新しい順）に並び替え

    if (error) {
        // エラーが発生した場合
        console.error('データ取得エラー:', error);
        newsContainer.innerHTML = '<h2>最新ニュース (エラー発生)</h2>';
        return;
    }

    // 取得に成功した場合
    // まずは既存のサンプル記事を空にする
    newsFeed.innerHTML = '<h2>最新ニュース</h2>'; 

    // 取得したデータを使ってHTMLを生成し、ページに追加
    for (const article of data) {
        newsFeed.innerHTML += `
            <article>
                <h3>${article.title}</h3>
                <p>${article.content}</p>
                <span>${new Date(article.published_at).toLocaleDateString()} - ${article.source}</span>
            </article>
        `;
    }

    // トレンドサマリーも更新（今はダミーメッセージ）
    trendsSummary.innerHTML = `
        <h2>業界トレンドサマリー</h2>
        <p>Supabaseから取得した${data.length}件のニュースを基に、AIがトレンドを分析します。（この機能は今後実装します）</p>
    `;
}

// 4. ページが読み込まれたら、上記の関数を実行
loadNews();
