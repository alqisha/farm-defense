import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

export const AuthDialog = () => {
    const session = useGameStore(state => state.session);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
    const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    // Auto-login for Telegram
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
            const tgUser = tg.initDataUnsafe.user;
            const dummyEmail = `tg_${tgUser.id}@farm.bot`;
            const dummyPass = `secret_farm_${tgUser.id}_pass`;

            const attemptAuth = async () => {
                setLoading(true);

                // Try login first
                let { error } = await supabase.auth.signInWithPassword({
                    email: dummyEmail,
                    password: dummyPass
                });

                if (error) {
                    // Start registration if login fails
                    const signUpRes = await supabase.auth.signUp({
                        email: dummyEmail,
                        password: dummyPass
                    });
                    error = signUpRes.error;
                }

                if (error) {
                    console.error("TG Auth failed:", error);
                    // Translate common errors
                    let errorText = error.message;
                    if (error.message.includes("Invalid login credentials")) errorText = "Неверный логин (или почта не подтверждена)";
                    if (error.message.includes("Email not confirmed")) errorText = "Почта не подтверждена! Отключите 'Confirm Email' в Supabase.";

                    setMsg({ text: `Ошибка: ${errorText}`, type: 'error' });
                    setLoading(false);
                }
            };

            attemptAuth();
        }
    }, []);

    const handleAuth = async () => {
        setLoading(true);
        setMsg(null);

        try {
            if (mode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMsg({ text: 'Ссылка для входа отправлена на Email! (Проверьте Спам)', type: 'success' });
            }
        } catch (error: any) {
            setMsg({ text: error.message || 'Ошибка авторизации.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // If logged in, hide component
    if (session) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {mode === 'LOGIN' ? 'Вход в игру' : 'Регистрация'}
                </h2>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />

                    {msg && (
                        <div className={`p-3 rounded-lg text-sm font-bold text-center ${msg.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-500/50' : 'bg-green-900/50 text-green-200 border border-green-500/50'
                            }`}>
                            {msg.text}
                        </div>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {loading ? 'Загрузка...' : (mode === 'LOGIN' ? 'Войти' : 'Создать аккаунт')}
                    </button>

                    <div className="text-center text-sm text-gray-400">
                        {mode === 'LOGIN' ? "Нет аккаунта? " : "Есть аккаунт? "}
                        <button
                            className="text-green-400 font-bold hover:underline"
                            onClick={() => { setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setMsg(null); }}
                        >
                            {mode === 'LOGIN' ? 'Регистрация' : 'Вход'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
