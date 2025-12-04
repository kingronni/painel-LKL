```javascript
// =================================================================
// SCRIPT DE INTEGRAÇÃO LKL - COLE ISSO NO "SCRIPT GLOBAL" (JAVASCRIPT)
// =================================================================

(function () {
    console.log('LKL Script: Iniciado v3.0 (Persistência)');

    // Chave única para salvar no navegador baseada na URL (para não misturar pedidos)
    const STORAGE_KEY = 'lkl_key_' + window.location.pathname.split('/').pop();

    function createKeyDisplay(keyText) {
        // Remove botão antigo se existir
        const oldBtn = document.getElementById('lkl-key-btn');
        if (oldBtn) oldBtn.remove();

        // Cria container da key
        const container = document.createElement('div');
        container.id = 'lkl-key-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '999999';
        container.style.backgroundColor = '#111';
        container.style.border = '2px solid #00ff41';
        container.style.borderRadius = '10px';
        container.style.padding = '15px';
        container.style.boxShadow = '0 0 20px rgba(0,255,65,0.4)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.fontFamily = 'monospace';
        container.style.minWidth = '250px';

        // Título
        const title = document.createElement('div');
        title.innerText = '✅ SUA KEY GERADA:';
        title.style.color = '#00ff41';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.textAlign = 'center';

        // A Key em si
        const keyDisplay = document.createElement('div');
        keyDisplay.innerText = keyText;
        keyDisplay.style.backgroundColor = '#222';
        keyDisplay.style.color = '#fff';
        keyDisplay.style.padding = '10px';
        keyDisplay.style.borderRadius = '5px';
        keyDisplay.style.textAlign = 'center';
        keyDisplay.style.fontSize = '18px';
        keyDisplay.style.letterSpacing = '1px';
        keyDisplay.style.border = '1px dashed #555';

        // Botão Copiar
        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 COPIAR KEY';
        copyBtn.style.backgroundColor = '#00ff41';
        copyBtn.style.color = '#000';
        copyBtn.style.border = 'none';
        copyBtn.style.padding = '8px';
        copyBtn.style.borderRadius = '5px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontWeight = 'bold';
        copyBtn.style.transition = 'transform 0.2s';

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(keyText);
            copyBtn.innerText = 'COPIADO!';
            setTimeout(() => copyBtn.innerText = '📋 COPIAR KEY', 2000);
        };

        container.appendChild(title);
        container.appendChild(keyDisplay);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
    }

    // Função principal que tenta injetar o botão
    function tryInjectButton() {
        // 1. Verifica se estamos na página de pagamento/sucesso
        if (!window.location.href.includes('/payment/')) {
            return;
        }

        // Se já temos a key salva, mostra ela direto!
        const savedKey = localStorage.getItem(STORAGE_KEY);
        if (savedKey) {
            if (!document.getElementById('lkl-key-container')) {
                createKeyDisplay(savedKey);
            }
            return;
        }

        // Se o botão já existe, não cria de novo
        if (document.getElementById('lkl-key-btn')) return;

        console.log('LKL Script: Página de pagamento detectada! Criando botão...');

        // 2. Cria o botão flutuante
        const btn = document.createElement('button');
        btn.id = 'lkl-key-btn'; // ID para evitar duplicatas
        btn.innerHTML = '🔑 RESGATAR MINHA KEY';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '999999'; // Z-index bem alto
        btn.style.padding = '15px 25px';
        btn.style.backgroundColor = '#00ff41'; // Verde Neon
        btn.style.color = 'black';
        btn.style.border = '2px solid white';
        btn.style.borderRadius = '8px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 0 20px rgba(0,255,65,0.6)';
        btn.style.fontFamily = 'monospace';
        btn.style.fontSize = '16px';
        btn.style.transition = 'all 0.3s ease';

        // Efeito Hover
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

        // 3. Função ao clicar
        btn.onclick = async function () {
            btn.innerHTML = '⏳ GERANDO...';
            btn.disabled = true;

            // Tenta pegar nome e telefone da página
            const pageText = document.body.innerText;
            // Melhora na busca do nome (tenta pegar próximo a "Cliente" ou "Nome")
            const clientName = pageText.match(/Nome:?\s*(.*?)(\n|$)/i)?.[1] || 'Cliente Site';
            const clientPhone = pageText.match(/Whatsapp:?\s*(.*?)(\n|$)/i)?.[1] || '';

            // Detecta o tipo de produto comprado baseado no texto da página
            let durationType = 'monthly'; // Default
            const upperText = pageText.toUpperCase();

            if (upperText.includes('SEMANAL') || upperText.includes('WEEKLY')) {
                durationType = 'weekly';
            } else if (upperText.includes('PERMANENTE') || upperText.includes('VITALICIO') || upperText.includes('LIFETIME')) {
                durationType = 'permanent';
            } else if (upperText.includes('MENSAL') || upperText.includes('MONTHLY')) {
                durationType = 'monthly';
            } else if (upperText.includes('DIARIO') || upperText.includes('DAILY')) {
                durationType = 'daily';
            }

            console.log('Gerando key do tipo:', durationType);

            // Pega o ID do pedido da URL (mesmo que usamos para o localStorage)
            const orderId = window.location.pathname.split('/').pop();

            try {
                const response = await fetch('https://painel-lkl.vercel.app/api/create?secret=LKL2024', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_name: clientName,
                        whatsapp: clientPhone,
                        duration: durationType,
                        order_id: orderId // Envia o ID para o backend travar
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // SALVA NO NAVEGADOR
                    localStorage.setItem(STORAGE_KEY, data.key);
                    
                    // MOSTRA A CAIXINHA PERMANENTE
                    createKeyDisplay(data.key);
                    
                } else {
                    alert('Erro ao gerar key: ' + (data.error || 'Desconhecido'));
                    btn.innerHTML = '❌ ERRO';
                    btn.disabled = false;
                }
            } catch (e) {
                console.error(e);
                alert('Erro de conexão com o servidor de keys.');
                btn.innerHTML = '❌ ERRO CONEXÃO';
                btn.disabled = false;
            }
        };

        document.body.appendChild(btn);
    }

    // Roda a verificação a cada 1 segundo (para lidar com carregamento lento ou SPA)
    setInterval(tryInjectButton, 1000);
    
    // Tenta rodar imediatamente também
    tryInjectButton();

})();
```
