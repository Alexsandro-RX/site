import { useState } from "react";

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [erro, setErro] = useState("");
  const [showJson, setShowJson] = useState(false);

  function maskCNPJ(value) {
    value = value.replace(/\D/g, "");

    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");

    return value.slice(0, 18);
  }

  function onlyNumbers(value) {
    return value.replace(/\D/g, "");
  }

  async function consultar() {
    try {
      setErro("");
      setEmpresa(null);
      setLoading(true);

      const clean = onlyNumbers(cnpj);

      if (clean.length !== 14) {
        throw new Error("CNPJ inválido");
      }

      const response = await fetch(
        `https://publica.cnpj.ws/cnpj/${clean}`
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar CNPJ");
      }

      const data = await response.json();

      setEmpresa(data);

    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value) {
    const number = Number(value);

    if (isNaN(number)) return value;

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatPhone(ddd, phone) {
    if (!phone) return "-";

    const full = `${ddd || ""}${phone}`;

    if (full.length === 11) {
      return full.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (full.length === 10) {
      return full.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return full;
  }

  async function copyJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(empresa, null, 2)
    );

    alert("JSON copiado");
  }

  function renderDynamic(data) {
    if (data === null || data === undefined) {
      return (
        <span className="text-slate-500">
          null
        </span>
      );
    }

    if (typeof data !== "object") {
      return (
        <span className="text-white break-all">
          {String(data)}
        </span>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={index}
              className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4"
            >
              <div className="text-xs text-cyan-400 mb-3">
                Item {index + 1}
              </div>

              {renderDynamic(item)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/40 transition"
          >
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              {key.replaceAll("_", " ")}
            </div>

            <div className="text-sm">
              {typeof value === "object"
                ? renderDynamic(value)
                : String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const estabelecimento = empresa?.estabelecimento;

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.15),transparent_40%)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">

        <div className="mb-10">

          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm mb-5">
            API Pública • Consulta Empresarial
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-4">
            Consulta de CNPJ
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl">
            Sistema moderno para consulta completa de empresas utilizando API pública em tempo real.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl mb-8">

          <div className="flex flex-col lg:flex-row gap-4">

            <input
              type="text"
              value={cnpj}
              onChange={(e) =>
                setCnpj(maskCNPJ(e.target.value))
              }
              placeholder="00.000.000/0000-00"
              className="flex-1 bg-slate-950/70 border border-slate-700 focus:border-cyan-400 rounded-2xl px-6 py-5 text-xl outline-none transition"
            />

            <button
              onClick={consultar}
              disabled={loading}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-2xl px-10 py-5 transition disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? "Consultando..."
                : "Consultar"}
            </button>

          </div>

          {erro && (
            <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4">
              {erro}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {empresa && (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

              <InfoCard
                title="Razão Social"
                value={empresa.razao_social}
              />

              <InfoCard
                title="Nome Fantasia"
                value={estabelecimento?.nome_fantasia}
              />

              <InfoCard
                title="Situação"
                value={estabelecimento?.situacao_cadastral}
              />

              <InfoCard
                title="Capital Social"
                value={formatMoney(
                  empresa.capital_social
                )}
              />

              <InfoCard
                title="Cidade / UF"
                value={`${estabelecimento?.cidade?.nome || "-"
                  } / ${estabelecimento?.estado?.sigla || "-"
                  }`}
              />

              <InfoCard
                title="Telefone"
                value={formatPhone(
                  estabelecimento?.ddd1,
                  estabelecimento?.telefone1
                )}
              />

              <InfoCard
                title="Email"
                value={estabelecimento?.email}
              />

              <InfoCard
                title="CNAE"
                value={
                  estabelecimento?.atividade_principal
                    ?.descricao
                }
              />

            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">

              <StatCard
                title="Campos retornados"
                value={
                  JSON.stringify(empresa).length
                }
              />

              <StatCard
                title="Estado"
                value={
                  estabelecimento?.estado?.sigla
                }
              />

              <StatCard
                title="Matriz / Filial"
                value={
                  estabelecimento?.tipo || "-"
                }
              />

            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 mb-8">

              <div className="flex flex-wrap gap-3 justify-between items-center mb-6">

                <div>
                  <h2 className="text-3xl font-bold">
                    JSON da API
                  </h2>

                  <p className="text-slate-400 mt-1">
                    Estrutura completa retornada pela consulta
                  </p>
                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      setShowJson(!showJson)
                    }
                    className="bg-slate-800 hover:bg-slate-700 rounded-2xl px-5 py-3 transition"
                  >
                    {showJson
                      ? "Ocultar JSON"
                      : "Ver JSON"}
                  </button>

                  <button
                    onClick={copyJson}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-2xl px-5 py-3 transition"
                  >
                    Copiar JSON
                  </button>

                </div>
              </div>

              {showJson && (
                <pre className="bg-slate-950 border border-slate-800 rounded-3xl p-6 overflow-auto text-sm text-cyan-300">
                  {JSON.stringify(empresa, null, 2)}
                </pre>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6">

              <h2 className="text-3xl font-bold mb-8">
                Estrutura Completa da API
              </h2>

              {renderDynamic(empresa)}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover:border-cyan-400/30 transition">

      <div className="text-slate-400 text-sm mb-3 uppercase tracking-wider">
        {title}
      </div>

      <div className="text-lg font-bold break-words">
        {value || "-"}
      </div>

    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-slate-900 border border-cyan-500/20 rounded-3xl p-6">

      <div className="text-slate-400 text-sm mb-3">
        {title}
      </div>

      <div className="text-3xl font-black text-cyan-300">
        {value || "-"}
      </div>

    </div>
  );
}