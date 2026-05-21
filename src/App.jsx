import React, { useMemo, useState } from "react";

export default function App() {
  const [uf, setUf] = useState("RS");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const normalize = (text = "") => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const expandAbbreviations = (text = "") => {
    return normalize(text)
      .replace(/\br\b/g, "rua")
      .replace(/\bav\b/g, "avenida")
      .replace(/\bavd\b/g, "avenida")
      .replace(/\bdr\b/g, "doutor")
      .replace(/\bgen\b/g, "general")
      .replace(/\bpres\b/g, "presidente")
      .replace(/\bmal\b/g, "marechal")
      .replace(/\bsto\b/g, "santo")
      .replace(/\bsta\b/g, "santa")
      .replace(/\bjd\b/g, "jardim")
      .replace(/\bvl\b/g, "vila");
  };

  const similarity = (a = "", b = "") => {
    a = expandAbbreviations(a);
    b = expandAbbreviations(b);

    if (!a || !b) return 0;

    if (a.includes(b) || b.includes(a)) {
      return 1;
    }

    const wordsA = a.split(" ");
    const wordsB = b.split(" ");

    let matches = 0;

    wordsA.forEach((wordA) => {
      if (
        wordsB.some(
          (wordB) =>
            wordA.includes(wordB) ||
            wordB.includes(wordA)
        )
      ) {
        matches++;
      }
    });

    return matches / Math.max(wordsA.length, wordsB.length);
  };

  const searchCEP = async () => {
    try {
      setLoading(true);
      setError("");
      setResults([]);
      setSelected(null);

      if (!cidade && !rua && !bairro) {
        throw new Error(
          "Informe ao menos cidade, bairro ou rua."
        );
      }

      const searchUF = uf || "RS";

      const searchCidade =
        cidade || "Porto Alegre";

      const searchRua =
        rua || bairro || "Centro";

      const url = `https://viacep.com.br/ws/${encodeURIComponent(
        searchUF
      )}/${encodeURIComponent(
        searchCidade
      )}/${encodeURIComponent(
        searchRua
      )}/json/`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Erro ao consultar CEP."
        );
      }

      const json = await response.json();

      if (!Array.isArray(json)) {
        throw new Error(
          "Nenhum resultado encontrado."
        );
      }

      const ranked = json
        .map((item) => {
          let score = 0;

          const ruaItem =
            item.logradouro || "";

          const bairroItem =
            item.bairro || "";

          const cidadeItem =
            item.localidade || "";

          if (rua) {
            score +=
              similarity(
                rua,
                ruaItem
              ) * 50;
          }

          if (bairro) {
            score +=
              similarity(
                bairro,
                bairroItem
              ) * 30;
          }

          if (cidade) {
            score +=
              similarity(
                cidade,
                cidadeItem
              ) * 20;
          }

          if (numero) {
            score += 5;
          }

          return {
            ...item,
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

      const unique = ranked.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.cep === item.cep
          )
      );

      setResults(unique.slice(0, 50));
    } catch (err) {
      setError(
        err.message ||
          "Erro ao localizar CEP."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCEP = async (cep) => {
    try {
      await navigator.clipboard.writeText(
        cep
      );

      alert("CEP copiado.");
    } catch {
      alert("Erro ao copiar.");
    }
  };

  const totalResults = useMemo(
    () => results.length,
    [results]
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="bg-[#111827] border border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8">

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Busca CEP
            </h1>

            <p className="text-zinc-400 mt-3 text-lg">
              Localize CEPs rapidamente
            </p>
          </div>

          {/* FORM */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <Input
              label="UF"
              value={uf}
              placeholder="RS"
              maxLength={2}
              onChange={(value) =>
                setUf(value.toUpperCase())
              }
            />

            <Input
              label="Cidade"
              value={cidade}
              placeholder="Digite a cidade"
              onChange={setCidade}
            />

            <Input
              label="Bairro"
              value={bairro}
              placeholder="Digite o bairro"
              onChange={setBairro}
            />

            <Input
              label="Rua"
              value={rua}
              placeholder="Digite a rua"
              onChange={setRua}
            />

            <Input
              label="Número"
              value={numero}
              placeholder="Digite o número"
              onChange={setNumero}
            />
          </div>

          <button
            onClick={searchCEP}
            disabled={loading}
            className="mt-6 h-14 px-8 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:opacity-50"
          >
            {loading
              ? "Buscando..."
              : "Buscar CEP"}
          </button>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
        </div>

        {/* LOADING */}

        {loading && (
          <div className="bg-[#111827] border border-zinc-800 rounded-3xl shadow-2xl p-10 text-center">

            <div className="animate-spin h-14 w-14 rounded-full border-4 border-zinc-700 border-t-blue-500 mx-auto mb-4"></div>

            <p className="text-zinc-400 text-lg">
              Procurando CEPs...
            </p>
          </div>
        )}

        {/* RESULTADOS */}

        {results.length > 0 && (
          <div className="bg-[#111827] border border-zinc-800 rounded-3xl shadow-2xl p-6">

            <div className="mb-6">

              <h2 className="text-3xl font-bold text-white">
                Resultados
              </h2>

              <p className="text-zinc-400 mt-1">
                {totalResults} CEP(s)
                encontrados
              </p>
            </div>

            <div className="space-y-4">

              {results.map(
                (item, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      setSelected(item)
                    }
                    className={`border rounded-3xl p-5 cursor-pointer transition-all duration-200 ${
                      selected?.cep ===
                      item.cep
                        ? "border-blue-500 bg-blue-500/10 shadow-2xl"
                        : "border-zinc-700 bg-[#1e293b] hover:border-blue-500 hover:bg-[#243244]"
                    }`}
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div className="space-y-2">

                        <div className="flex flex-wrap items-center gap-3">

                          <span className="text-3xl font-black text-white">
                            {item.cep}
                          </span>

                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                            CEP válido
                          </span>
                        </div>

                        <p className="font-semibold text-zinc-200 text-lg">
                          {item.logradouro}
                        </p>

                        <p className="text-zinc-400">
                          Bairro: {item.bairro || "-"}
                        </p>

                        <div className="flex flex-wrap gap-2 text-sm text-zinc-400">

                          <span>
                            {item.localidade}
                          </span>

                          <span>•</span>

                          <span>
                            {item.uf}
                          </span>

                          <span>•</span>

                          <span>
                            IBGE: {item.ibge}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            copyCEP(
                              item.cep
                            );
                          }}
                          className="h-11 px-5 rounded-2xl border border-zinc-600 text-zinc-200 font-semibold hover:bg-zinc-700 transition"
                        >
                          Copiar
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelected(
                              item
                            );
                          }}
                          className="h-11 px-5 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition"
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* SELECIONADO */}

        {selected && (
          <div className="bg-[#111827] border border-zinc-800 rounded-3xl shadow-2xl p-6">

            <h2 className="text-3xl font-bold mb-6 text-white">
              CEP Selecionado
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <InfoCard
                title="CEP"
                value={selected.cep}
              />

              <InfoCard
                title="Rua"
                value={
                  selected.logradouro
                }
              />

              <InfoCard
                title="Bairro"
                value={selected.bairro}
              />

              <InfoCard
                title="Cidade"
                value={`${selected.localidade} / ${selected.uf}`}
              />

              <InfoCard
                title="IBGE"
                value={selected.ibge}
              />

              <InfoCard
                title="DDD"
                value={selected.ddd}
              />

              <InfoCard
                title="Número"
                value={numero}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">
        {label}
      </label>

      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full h-14 px-5 rounded-2xl border border-zinc-700 bg-[#1e293b] text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  );
}

function InfoCard({
  title,
  value,
}) {
  return (
    <div className="border border-zinc-700 rounded-3xl p-5 bg-[#1e293b]">
      <p className="text-sm text-zinc-400 mb-1">
        {title}
      </p>

      <p className="font-bold text-white break-words text-lg">
        {value || "-"}
      </p>
    </div>
  );
}