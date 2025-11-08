// 필요한 모듈들을 가져옵니다.
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');

// .env 파일에서 환경 변수를 로드합니다.
dotenv.config();

// Express 앱을 초기화합니다.
const app = express();
const port = process.env.PORT || 3000;

// OpenAI 클라이언트를 초기화합니다.
// .env 파일에 있는 OPENAI_API_KEY를 사용합니다.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- 미들웨어 설정 ---
// 현재 디렉토리의 정적 파일(index.html)을 제공합니다.
app.use(express.static(path.join(__dirname)));
// API 요청의 JSON 본문을 파싱합니다.
app.use(express.json());

// 루트 경로 GET 요청을 명시적으로 처리하여 배포 환경에서 404를 방지합니다.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- 채팅을 위한 API 엔드포인트 ---
app.post('/chat', async (req, res) => {
    // 클라이언트로부터 메시지와 대화 기록을 받습니다.
    const { message, history } = req.body;

    // 메시지가 없으면 오류를 반환합니다.
    if (!message) {
        return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // --- 중요: OpenAI API 호출 ---
    // 서버가 OpenAI와 통신하는 부분입니다.
    // 현재 사용자 메시지와 이전 대화 기록을 함께 보냅니다.
    // 'system' 메시지는 챗봇의 행동을 설정하는 데 도움이 됩니다.
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // 또는 'gpt-4'와 같은 다른 모델 사용 가능
            messages: [
                // --- 시스템 메시지: 봇의 성격과 지침을 정의합니다. ---
                // 이 메시지를 수정하여 봇의 행동을 바꿀 수 있습니다.
                // 예를 들어, 더 격식있게, 재미있게, 또는 특정 분야에 전문화되도록 만들 수 있습니다.
                {
                    role: 'system',
                    content: '당신은 도움이 되는 어시스턴트입니다. 답변은 간결하고 친절하게 유지하세요.'
                },
                // --- 대화 기록 ---
                // 컨텍스트를 위해 이전 메시지들을 포함합니다.
                ...history,
                // --- 현재 사용자 메시지 ---
                {
                    role: 'user',
                    content: message
                }
            ],
        });

        // API 응답에서 봇의 답변을 추출합니다.
        const botResponse = completion.choices[0].message.content;
        // 클라이언트에 답변을 JSON 형태로 보냅니다.
        res.json({ reply: botResponse });

    } catch (error) {
        console.error('OpenAI API 호출 중 오류 발생:', error);
        // OpenAI 관련 특정 오류 유형을 확인하는 것이 좋습니다.
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'OpenAI API와 통신하는 중 오류가 발생했습니다.' });
        }
    }
});

// --- 서버 시작 ---
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    console.log('.env 파일에 OPENAI_API_KEY를 설정했는지 확인하세요.');
});
