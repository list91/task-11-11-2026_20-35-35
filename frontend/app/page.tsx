"use client";
import { useCallback, useEffect, useState } from "react";

type Person = { name: string; age: string };
type EventInfo = { title: string; capacity: number; seats_left: number; full_price: number; child_price: number };
type Order = { id: string; email: string; total: number; participants: { name: string; age: number; price: number }[] };
type Step = "form" | "review" | "done";

const MAX = 4;
const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
const isAge = (a: string) => /^\d{1,3}$/.test(a) && +a <= 120;
const card = "bg-white border border-gray-200 rounded-xl p-4 mb-3";
const input = "w-full rounded-lg border px-3 py-2.5 text-base outline-none focus:border-violet-600 ";
const btn = "rounded-lg px-5 py-2.5 border border-violet-600 disabled:opacity-50 disabled:cursor-not-allowed ";

export default function Page() {
  const [step, setStep] = useState<Step>("form");
  const [people, setPeople] = useState<Person[]>([{ name: "", age: "" }]);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ev, setEv] = useState<EventInfo | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [soldOut, setSoldOut] = useState<{ left: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");

  const loadEvent = useCallback(async () => {
    const r = await fetch("/api/event", { cache: "no-store" });
    if (r.ok) setEv(await r.json());
  }, []);
  useEffect(() => { loadEvent(); }, [loadEvent]);

  const full = ev?.full_price ?? 2000;
  const child = ev?.child_price ?? 1000;
  const price = (a: string) => (+a < 14 ? child : full);
  const total = people.every((p) => isAge(p.age)) ? people.reduce((s, p) => s + price(p.age), 0) : null;

  const setP = (i: number, k: keyof Person, v: string) =>
    setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  function validate() {
    const e: Record<string, string> = {};
    people.forEach((p, i) => {
      if (!p.name.trim()) e["n" + i] = "Укажите имя";
      if (!isAge(p.age)) e["a" + i] = "Возраст 0–120";
    });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Введите корректный email";
    if (!Object.keys(e).some((k) => k[0] === "a") && people.some((p) => +p.age < 14) && !people.some((p) => +p.age >= 18))
      e.rule = "Ребёнок младше 14 лет может попасть на мероприятие только с участником от 18 лет в том же заказе.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function confirm() {
    setBusy(true); setFail(""); setSoldOut(null);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ email, participants: people.map((p) => ({ name: p.name.trim(), age: +p.age })) }),
      });
      if (r.status === 201) { setOrder(await r.json()); setStep("done"); }
      else if (r.status === 409) { const b = await r.json(); setSoldOut({ left: b.detail.seats_left }); }
      else setFail("Не удалось оформить заказ. Проверьте данные и попробуйте снова.");
    } catch { setFail("Нет связи с сервером. Попробуйте ещё раз."); }
    finally { setBusy(false); loadEvent(); }
  }

  const demo = async (what: "sell-out" | "reset") => { await fetch(`/api/demo/${what}`, { method: "POST" }); loadEvent(); };
  const reset = () => { setPeople([{ name: "", age: "" }]); setEmail(""); setErrors({}); setOrder(null); setSoldOut(null); setStep("form"); loadEvent(); };
  const Err = ({ k }: { k: string }) => (errors[k] ? <div className="text-sm text-red-600 mt-1">{errors[k]}</div> : null);
  const bad = (k: string) => (errors[k] ? "border-red-500" : "border-gray-300");

  return (
    <main className="max-w-2xl mx-auto p-3 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold my-2">Оформление билетов</h1>
      <div className="flex gap-1.5 flex-wrap text-sm mb-3">
        {(["form", "review", "done"] as Step[]).map((s, i) => (
          <span key={s} className={"px-3 py-1 rounded-full " + (step === s ? "bg-violet-600 text-white" : "bg-gray-200")}>
            {i + 1}. {["Участники", "Проверка", "Готово"][i]}
          </span>
        ))}
      </div>

      {step === "form" && (
        <>
          <section className={card}>
            <h2 className="font-semibold mb-3">Участники ({people.length} из {MAX})</h2>
            {errors.rule && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-3">{errors.rule}</div>}
            {people.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_40px] sm:grid-cols-[1fr_100px_40px] gap-2 mb-3 items-start">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Имя</label>
                  <input className={input + bad("n" + i)} value={p.name} onChange={(e) => setP(i, "name", e.target.value)} />
                  <Err k={"n" + i} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Возраст</label>
                  <input className={input + bad("a" + i)} inputMode="numeric" value={p.age} onChange={(e) => setP(i, "age", e.target.value)} />
                  <Err k={"a" + i} />
                </div>
                <div>
                  <label className="block text-sm mb-1">&nbsp;</label>
                  <button aria-label="Удалить участника" disabled={people.length < 2} onClick={() => setPeople(people.filter((_, j) => j !== i))}
                    className="w-full py-2.5 rounded-lg border border-gray-300 text-red-700 disabled:opacity-40">✕</button>
                </div>
              </div>
            ))}
            <button className={btn + "bg-white text-violet-600"} disabled={people.length >= MAX} onClick={() => setPeople([...people, { name: "", age: "" }])}>+ Добавить участника</button>
          </section>
          <section className={card}>
            <h2 className="font-semibold mb-3">Контакт</h2>
            <label className="block text-sm text-gray-600 mb-1">Email (один на заказ)</label>
            <input type="email" className={input + bad("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Err k="email" />
          </section>
          <div className="flex justify-between text-xl font-bold my-3"><span>Итого</span><span>{total === null ? "—" : rub(total)}</span></div>
          <button className={btn + "bg-violet-600 text-white w-full sm:w-auto"} onClick={() => validate() && setStep("review")}>Продолжить</button>
        </>
      )}

      {step === "review" && (
        <>
          {soldOut && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-3">
              <b>Места закончились.</b> Пока вы оформляли заказ, осталось мест: {soldOut.left}, а нужно {people.length}. Заказ не создан, деньги не списаны.
              {soldOut.left > 0 ? " Уберите лишних участников и подтвердите снова." : " Попробуйте позже."}
            </div>
          )}
          {fail && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-3">{fail}</div>}
          <section className={card}>
            <h2 className="font-semibold mb-3">Состав заказа</h2>
            {people.map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                <div>{p.name}, {p.age} л.<div className="text-sm text-gray-500">{+p.age < 14 ? "Детский билет" : "Полный билет"}</div></div>
                <div>{rub(price(p.age))}</div>
              </div>
            ))}
            <div className="flex justify-between text-xl font-bold mt-3"><span>Итого</span><span>{rub(total ?? 0)}</span></div>
            <p className="text-sm text-gray-500 mt-2">Email: {email}</p>
          </section>
          <div className="flex gap-2 flex-wrap">
            <button className={btn + "bg-white text-violet-600 flex-1 sm:flex-none"} onClick={() => { setSoldOut(null); setStep("form"); }}>Изменить данные</button>
            <button className={btn + "bg-violet-600 text-white flex-1 sm:flex-none"} disabled={busy} onClick={confirm}>{busy ? "Оформляем…" : "Подтвердить заказ"}</button>
          </div>
        </>
      )}

      {step === "done" && order && (
        <>
          <div className="bg-green-50 border border-green-300 text-green-900 rounded-xl p-4 mb-3">
            <h2 className="font-semibold text-lg">Заказ оформлен ✓</h2>
            <p>Номер: <b>{order.id.slice(0, 8)}</b><br />Подтверждение отправлено на {order.email}</p>
          </div>
          <section className={card}>
            {order.participants.map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100"><span>{p.name}, {p.age} л.</span><span>{rub(p.price)}</span></div>
            ))}
            <div className="flex justify-between text-xl font-bold mt-3"><span>Итого</span><span>{rub(order.total)}</span></div>
          </section>
          <button className={btn + "bg-violet-600 text-white"} onClick={reset}>Новый заказ</button>
        </>
      )}

      <section className="border border-dashed border-gray-300 rounded-xl p-3 mt-6 text-sm">
        <b>Демо-панель</b> · свободно мест: {ev ? `${ev.seats_left} из ${ev.capacity}` : "…"}
        <div className="flex gap-2 flex-wrap mt-2">
          <button className="border rounded-lg px-3 py-1.5 bg-white" onClick={() => demo("sell-out")}>Раскупить все места</button>
          <button className="border rounded-lg px-3 py-1.5 bg-white" onClick={() => demo("reset")}>Вернуть места</button>
        </div>
      </section>
    </main>
  );
}
