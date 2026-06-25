// 💡 COLE A URL DA SUA IMPLANTAÇÃO DO GOOGLE APPS SCRIPT AQUI:
const API_URL = "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI";

// Controle de Telas (Navegação Interna)
const authContainer = document.getElementById('auth-container');
const loginBox = document.getElementById('login-box');
const cadastroBox = document.getElementById('cadastro-box');
const recuperarBox = document.getElementById('recuperar-box');
const mainDashboard = document.getElementById('main-dashboard');

// Elementos de Informação do Usuário
const userDisplayName = document.getElementById('user-display-name');
const userDisplayMat = document.getElementById('user-display-mat');

// Elementos do Painel de Estoque
const formProduto = document.getElementById('form-produto');
const loadingEl = document.getElementById('loading');
const tbody = document.querySelector('#tabela-produtos tbody');
const listaVencidos = document.getElementById('lista-vencidos');
const listaAtencao = document.getElementById('lista-atencao');

// Navegação entre caixas de Autenticação
document.getElementById('link-ir-cadastro').addEventListener('click', () => toggleAuthBox('cadastro'));
document.getElementById('link-ir-login').addEventListener('click', () => toggleAuthBox('login'));
document.getElementById('link-esqueci-senha').addEventListener('click', () => toggleAuthBox('recuperar'));
document.getElementById('link-voltar-login').addEventListener('click', () => toggleAuthBox('login'));
document.getElementById('btn-logout').addEventListener('click', logout);

function toggleAuthBox(box) {
    loginBox.classList.add('hidden');
    cadastroBox.classList.add('hidden');
    recuperarBox.classList.add('hidden');
    
    if (box === 'login') loginBox.classList.remove('hidden');
    if (box === 'cadastro') cadastroBox.classList.remove('hidden');
    if (box === 'recuperar') recuperarBox.classList.remove('hidden');
}

// Evento: Registro / Inscrição
document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(API_URL.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) return alert("Configure a API_URL primeiro!");
    
    const nome = document.getElementById('cad-nome').value;
    const matricula = document.getElementById('cad-matricula').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', nome, matricula, email, senha })
        });
        alert("Solicitação enviada! Se os dados estiverem corretos, sua conta foi registrada no Google Sheets. Tente fazer login.");
        document.getElementById('form-cadastro').reset();
        toggleAuthBox('login');
    } catch (err) {
        alert("Erro na comunicação com o servidor.");
    }
});

// Evento: Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(API_URL.includes("SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI")) return alert("Configure a API_URL primeiro!");

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const response = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
        const result = await response.json();

        if (result.status === 'success') {
            userDisplayName.innerText = result.user.nome;
            userDisplayMat.innerText = result.user.matricula;
            
            authContainer.classList.add('hidden');
            mainDashboard.classList.remove('hidden');
            buscarProdutos();
        } else {
            alert(result.message || "E-mail ou senha incorretos.");
        }
    } catch (err) {
        alert("Erro ao autenticar. Verifique seus dados.");
    }
});

// Evento: Recuperação de Senha
document.getElementById('form-recuperar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('rec-email').value;

    try {
        const response = await fetch(`${API_URL}?action=recover&email=${encodeURIComponent(email)}`);
        const result = await response.json();
        alert(result.message);
        if(result.status === 'success') {
            toggleAuthBox('login');
        }
    } catch (err) {
        alert("Erro ao processar recuperação.");
    }
});

// Buscar e renderizar produtos do estoque
async function buscarProdutos() {
    loadingEl.style.display = "block";
    tbody.innerHTML = "";
    
    try {
        const response = await fetch(`${API_URL}?action=getProducts`);
        const produtos = await response.json();
        processarValidades(produtos);
    } catch (error) {
        console.error("Erro:", error);
    } finally {
        loadingEl.style.display = "none";
    }
}

function processarValidades(produtos) {
    listaVencidos.innerHTML = "";
    listaAtencao.innerHTML = "";
    let totalVencidosHoje = 0;
    let totalAtencao = 0;

    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    produtos.forEach(p => {
        const dataValidade = new Date(p.validade + 'T00:00:00');
        const diferencaTempo = dataValidade.getTime() - hoje.getTime();
        const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

        let statusText = "", badgeClass = "";
        let formatarData = dataValidade.toLocaleDateString('pt-BR');

        if (diferencaDias < 0) {
            statusText = "Vencido";
            badgeClass = "badge-vencido";
            listaVencidos.innerHTML += `<li>❌ ${p.produto} (Venceu em ${formatarData})</li>`;
            totalVencidosHoje++;
        } else if (diferencaDias === 0) {
            statusText = "VENCE HOJE!";
            badgeClass = "badge-vencido";
            listaVencidos.innerHTML += `<li>🚨 Atenção: ${p.produto} vence HOJE!</li>`;
            totalVencidosHoje++;
        } else if (diferencaDias <= 7) {
            statusText = "Risco Crítico";
            badgeClass = "badge-critico";
            listaAtencao.innerHTML += `<li>⚠️ ${p.produto} em ${diferencaDias} dias</li>`;
            totalAtencao++;
        } else {
            statusText = "Em dia";
            badgeClass = "badge-ok";
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.produto}</strong></td>
            <td>${formatarData}</td>
            <td>${diferencaDias < 0 ? `Vencido há ${Math.abs(diferencaDias)} dias` : diferencaDias === 0 ? 'Vence hoje' : `${diferencaDias} dias`}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });

    if(totalVencidosHoje === 0) listaVencidos.innerHTML = "<li>Nenhum produto crítico ou vencido hoje! 🎉</li>";
    if(totalAtencao === 0) listaAtencao.innerHTML = "<li>Nenhum produto próximo da validade.</li>";
}

// Cadastrar Produto
formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-salvar');
    const produto = document.getElementById('nome').value;
    const validade = document.getElementById('validade').value;

    btn.disabled = true;
    btn.innerText = "Salvando...";

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add", produto, validade })
        });
        formProduto.reset();
        setTimeout(buscarProdutos, 1500); 
    } catch (error) {
        alert("Erro ao salvar produto.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Salvar no Banco";
    }
});

function logout() {
    mainDashboard.classList.add('hidden');
    authContainer.classList.remove('hidden');
    document.getElementById('form-login').reset();
}

