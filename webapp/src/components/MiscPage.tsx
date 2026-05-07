const MiscPage = () => {
  const tg = window.Telegram?.WebApp as {
    initDataUnsafe?: { user?: { id?: number | string } }
  } | undefined;
  const tgUser = tg?.initDataUnsafe?.user?.id;

  return <div>Здесь короче рандомайзер сделаем. User ID: {tgUser}</div>;
}

export default MiscPage;