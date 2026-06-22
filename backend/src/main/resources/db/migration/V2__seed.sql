-- Seed from external Postgres on 2026-06-22 13:35:42 UTC

--
--




--
-- Data for Name: user_group; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO user_group (id, name) VALUES ('00000000-0004-4000-8000-000000000001', 'Kotaty');


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO user_role (id, name) VALUES ('00000000-0005-4000-8000-000000000001', 'user');
INSERT INTO user_role (id, name) VALUES ('00000000-0005-4000-8000-000000000002', 'admin');


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO app_user (id, name, user_group_id, role_id) VALUES ('324953869', 'Макс', '00000000-0004-4000-8000-000000000001', '00000000-0005-4000-8000-000000000002');
INSERT INTO app_user (id, name, user_group_id, role_id) VALUES ('790091379', 'Лёха', '00000000-0004-4000-8000-000000000001', '00000000-0005-4000-8000-000000000001');
INSERT INTO app_user (id, name, user_group_id, role_id) VALUES ('748182009', 'Дима', '00000000-0004-4000-8000-000000000001', '00000000-0005-4000-8000-000000000001');
INSERT INTO app_user (id, name, user_group_id, role_id) VALUES ('337657169', 'Тёма', '00000000-0004-4000-8000-000000000001', '00000000-0005-4000-8000-000000000001');
INSERT INTO app_user (id, name, user_group_id, role_id) VALUES ('413515630', 'Женя', '00000000-0004-4000-8000-000000000001', '00000000-0005-4000-8000-000000000001');


--
-- Data for Name: movie; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('52223a53-8f38-416d-a2d5-b79d678cb0ac', 'Репортаж', 'Да убери ты камеру', '790091379', 12, '2026-05-29 08:40:02.164127+00', '2026-05-29 08:40:02.164127+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000001', 'Идеальные дни', 'Японец 2 часа моет туалеты', '337657169', 0, '2025-04-17 12:00:00+00', '2025-04-17 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000003', 'Бедные несчастные', 'Эмма Стоун - любит секс', '324953869', 0, '2025-05-01 12:00:00+00', '2025-05-01 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000004', 'Зона интересов', 'ЧБ из польских ларегей', '337657169', 1, '2025-05-08 12:00:00+00', '2025-05-08 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000005', 'Голос монстра', 'Дерево типо злое, а потом доброе', '748182009', 1, '2025-05-15 12:00:00+00', '2025-05-15 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000007', 'что-то норм', '', '790091379', 1, '2025-05-29 12:00:00+00', '2025-05-29 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000008', 'Серый человек', 'Райн Гослинг и Капитан Америка дерутся в фонтане', '324953869', 1, '2025-06-05 12:00:00+00', '2025-06-05 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000009', 'Первый день моей жизни', 'Труповозка. Самоуибйцы воскресли', '337657169', 2, '2025-06-12 12:00:00+00', '2025-06-12 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000a', 'Неудачное время', '', '748182009', 2, '2025-06-19 12:00:00+00', '2025-06-19 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000c', 'Еретик', 'есть три бога. но кто настоящий ?', '790091379', 2, '2025-07-03 12:00:00+00', '2025-07-03 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000d', 'Виды доброты', 'Эмма Стоун - свингер', '324953869', 2, '2025-07-10 12:00:00+00', '2025-07-10 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000e', 'Зеркало для героя', 'Мужик споткнулся об арматуру и попал в прошлое', '337657169', 3, '2025-07-17 12:00:00+00', '2025-07-17 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000f', 'Пять неизвестных', 'мужики потеряли память', '748182009', 3, '2025-07-24 12:00:00+00', '2025-07-24 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000011', 'Новый порядок', 'когда хотела свадьбу, а тебя износиловали военные', '790091379', 3, '2025-08-07 12:00:00+00', '2025-08-07 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000012', 'Секреты ЛА', 'все копы продажные', '324953869', 3, '2025-08-14 12:00:00+00', '2025-08-14 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000013', 'Цветы войны', 'Бэтмен против японцев', '337657169', 4, '2025-08-21 12:00:00+00', '2025-08-21 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000014', 'Пленница', 'Мужик заставляет бегать не свою дочку', '748182009', 4, '2025-08-28 12:00:00+00', '2025-08-28 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000016', 'Американское чтиво', 'черный мужик написал книгу про черных, но ему не нравится', '790091379', 4, '2025-09-11 12:00:00+00', '2025-09-11 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000017', 'Седьмая печать', 'мужик продул в шахматы смерти', '324953869', 4, '2025-09-18 12:00:00+00', '2025-09-18 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000018', 'Новые парни турбо', '10/10 от жени', '337657169', 5, '2025-09-25 12:00:00+00', '2025-09-25 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000019', 'Два, три, демон приди', 'Подростки деражатся за ручку с мертвыми', '748182009', 5, '2025-10-02 12:00:00+00', '2025-10-02 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001b', 'Жизнь задом наперед', 'Том Харди бомж', '324953869', 5, '2025-10-16 12:00:00+00', '2025-10-16 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001c', 'Куда ты пропала Бернадет?', 'Уехала в Антарктиду от дочки и мужа', '337657169', 6, '2025-10-23 12:00:00+00', '2025-10-23 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001d', 'Орудия', 'Дети странно бегали ночью к чужой бабуле', '748182009', 6, '2025-10-30 12:00:00+00', '2025-10-30 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001f', 'Опус', 'Обычная жизнь Джона Малковича', '790091379', 6, '2025-11-13 12:00:00+00', '2025-11-13 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000020', 'Выкуп', 'Мэл Гибсон зажал деняк', '324953869', 6, '2025-11-20 12:00:00+00', '2025-11-20 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000021', 'Человек', 'меньшинства жалуются на свою тяжелую жизнь', '337657169', 7, '2025-11-27 12:00:00+00', '2025-11-27 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000022', 'Визит', 'дети тусовались не у своих родственников', '748182009', 7, '2025-12-04 12:00:00+00', '2025-12-04 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000024', '?', 'Негр спецназовец всех заборол', '790091379', 7, '2025-12-18 12:00:00+00', '2025-12-18 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000025', 'Святые из Бундокка', 'Братья мочат всех, прикрываясь христианством', '324953869', 7, '2025-12-25 12:00:00+00', '2025-12-25 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000026', 'Общество мертвых поэтов', 'Пацаны стояли на партах почем зря', '337657169', 8, '2026-01-01 12:00:00+00', '2026-01-01 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000027', 'Бугония', 'Лысая Эмма Уотсон - всё таки инопланетянка', '748182009', 8, '2026-01-08 12:00:00+00', '2026-01-08 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000029', 'За гранью ЗЛА', 'Пять историй, где все пошло не так', '790091379', 8, '2026-01-22 12:00:00+00', '2026-01-22 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002a', 'Обыкновенные ангелы', 'Алан Ричсон агрился на бабу, которая спасала его дочку', '324953869', 8, '2026-01-29 12:00:00+00', '2026-01-29 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002b', 'Купала', 'Купала боится текста в воде', '337657169', 9, '2026-02-05 12:00:00+00', '2026-02-05 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002c', 'Верни её из мертвых', 'У сатанистки ничего не получилось', '748182009', 9, '2026-02-12 12:00:00+00', '2026-02-12 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002d', 'Новичок', 'Рами Малек обманывает Морфиуса', '790091379', 9, '2026-02-19 12:00:00+00', '2026-02-19 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002e', 'Метод исключения', 'Кореец всех убивает ради вакантного места', '324953869', 9, '2026-02-26 12:00:00+00', '2026-02-26 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000030', 'Удачи, веселья, не сдохни', 'Кототавр ссыт съедобным конфити на зумеров', '748182009', 10, '2026-03-12 12:00:00+00', '2026-03-12 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000031', 'Исполнитель желаний', 'У охранника было два желания, хотя у всех одно', '790091379', 10, '2026-03-19 12:00:00+00', '2026-03-19 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000032', 'Кончится лето', 'Юра Борисов мочит якутов почем зря', '324953869', 10, '2026-03-26 12:00:00+00', '2026-03-26 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000034', 'Пожары', 'Инцестис', '748182009', 11, '2026-04-09 12:00:00+00', '2026-04-09 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('7e699dc3-b621-4247-8a2b-003a68ff8c00', 'Шпионские игры', 'Шпионов зашпионили', '324953869', 11, '2026-05-07 14:11:17.336694+00', '2026-05-07 14:11:17.336694+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('3ba1cba0-ad08-4c0d-b3d3-564bd3925c95', 'Ночной продавец', '1.5 кг не свинины', '337657169', 11, '2026-05-14 18:16:20.204569+00', '2026-05-14 18:16:20.204569+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('3c1df28f-c535-4580-a1bd-f65d2b2ce542', 'Бабадук', 'Поешь говна', '790091379', 11, '2026-05-07 18:22:23.683054+00', '2026-05-29 08:51:11.271429+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000002f', 'Боги, наверное, сошли с ума', 'Бушмен нашел бутылку, а потом выбросил', '337657169', 10, '2026-03-05 12:00:00+00', '2026-05-29 15:33:07.198854+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000002', 'что-то норм', '', '413515630', 0, '2025-04-24 12:00:00+00', '2025-04-24 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000006', 'явно какая-то муть', '', '413515630', 1, '2025-05-22 12:00:00+00', '2025-05-22 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000000b', 'Убийца', 'У киллера ничего не получается', '413515630', 2, '2025-06-26 12:00:00+00', '2025-06-26 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000010', 'Мыс траха', 'ДэНиро мстит авдокату', '413515630', 3, '2025-07-31 12:00:00+00', '2025-07-31 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000015', 'Статус Брэда', 'батяня поверил в себя', '413515630', 4, '2025-09-04 12:00:00+00', '2025-09-04 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001a', 'Денежная игла', 'Рехаб грабит государство', '413515630', 5, '2025-10-09 12:00:00+00', '2025-10-09 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-00000000001e', 'Сонная Лощина', 'Джонни Дэп против безголового Кристофера Уокена', '413515630', 6, '2025-11-06 12:00:00+00', '2025-11-06 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000023', 'Горькая луна', 'баба превратилась в арбузершу', '413515630', 7, '2025-12-11 12:00:00+00', '2025-12-11 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000028', '10 негритят', 'Амонгус', '413515630', 8, '2026-01-15 12:00:00+00', '2026-01-15 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('00000000-0002-4000-8000-000000000033', 'Я достану тебя, ублюдок', '12 дюймов смеха (очень мало)', '413515630', 10, '2026-04-02 12:00:00+00', '2026-04-02 12:00:00+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('de5357ac-ab6b-422e-ab05-865f9ae808ae', 'Тёмный город', 'Восставшие из ада играли в симс', '413515630', 11, '2026-05-21 18:05:51.712479+00', '2026-05-21 18:05:51.712479+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('4aad53e4-a4e6-41d5-829d-48e6606b9ea5', 'Последний киногерой', 'Арнольд Браунегер', '324953869', 12, '2026-06-04 17:23:08.208382+00', '2026-06-04 17:29:32.309433+00');
INSERT INTO movie (id, title, description, owner_id, round, created_at, updated_at) VALUES ('e3c1f834-6ce9-4215-96a3-a21cd77db369', 'Догвиль', 'Правила индустрии грузоперевозок', '748182009', 12, '2026-06-18 18:58:51.518549+00', '2026-06-18 18:58:51.518549+00');


--
-- Data for Name: rating; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000001', '00000000-0002-4000-8000-000000000010', '324953869', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000002', '00000000-0002-4000-8000-000000000010', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000003', '00000000-0002-4000-8000-000000000010', '748182009', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000004', '00000000-0002-4000-8000-000000000010', '337657169', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000005', '00000000-0002-4000-8000-000000000011', '324953869', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000007', '00000000-0002-4000-8000-000000000011', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000009', '00000000-0002-4000-8000-000000000012', '790091379', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000a', '00000000-0002-4000-8000-000000000012', '748182009', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000b', '00000000-0002-4000-8000-000000000013', '324953869', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000d', '00000000-0002-4000-8000-000000000013', '748182009', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000e', '00000000-0002-4000-8000-000000000014', '324953869', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000010', '00000000-0002-4000-8000-000000000014', '790091379', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000011', '00000000-0002-4000-8000-000000000014', '337657169', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000012', '00000000-0002-4000-8000-000000000015', '324953869', 10.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000013', '00000000-0002-4000-8000-000000000015', '790091379', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000014', '00000000-0002-4000-8000-000000000015', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000015', '00000000-0002-4000-8000-000000000015', '337657169', 8.70);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000016', '00000000-0002-4000-8000-000000000016', '324953869', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000018', '00000000-0002-4000-8000-000000000016', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000019', '00000000-0002-4000-8000-000000000016', '337657169', 6.60);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001b', '00000000-0002-4000-8000-000000000017', '790091379', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001c', '00000000-0002-4000-8000-000000000017', '748182009', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001d', '00000000-0002-4000-8000-000000000017', '337657169', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001e', '00000000-0002-4000-8000-000000000018', '324953869', 2.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000020', '00000000-0002-4000-8000-000000000018', '748182009', 1.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000022', '00000000-0002-4000-8000-000000000019', '337657169', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000023', '00000000-0002-4000-8000-00000000001a', '324953869', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000024', '00000000-0002-4000-8000-00000000001a', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000025', '00000000-0002-4000-8000-00000000001a', '748182009', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000026', '00000000-0002-4000-8000-00000000001a', '337657169', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000028', '00000000-0002-4000-8000-00000000001b', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000029', '00000000-0002-4000-8000-00000000001b', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002a', '00000000-0002-4000-8000-00000000001b', '337657169', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002b', '00000000-0002-4000-8000-00000000001d', '324953869', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002d', '00000000-0002-4000-8000-00000000001d', '337657169', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002e', '00000000-0002-4000-8000-00000000001e', '324953869', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002f', '00000000-0002-4000-8000-00000000001e', '748182009', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000030', '00000000-0002-4000-8000-00000000001e', '337657169', 7.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000032', '00000000-0002-4000-8000-000000000020', '790091379', 8.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000033', '00000000-0002-4000-8000-000000000020', '748182009', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000034', '00000000-0002-4000-8000-000000000020', '337657169', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000035', '00000000-0002-4000-8000-000000000021', '324953869', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000037', '00000000-0002-4000-8000-000000000021', '790091379', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000038', '00000000-0002-4000-8000-000000000021', '748182009', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000039', '00000000-0002-4000-8000-000000000022', '324953869', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003b', '00000000-0002-4000-8000-000000000022', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003c', '00000000-0002-4000-8000-000000000022', '337657169', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003d', '00000000-0002-4000-8000-000000000023', '324953869', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003e', '00000000-0002-4000-8000-000000000023', '790091379', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003f', '00000000-0002-4000-8000-000000000023', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000041', '00000000-0002-4000-8000-000000000025', '790091379', 5.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000042', '00000000-0002-4000-8000-000000000025', '748182009', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000043', '00000000-0002-4000-8000-000000000025', '337657169', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000044', '00000000-0002-4000-8000-000000000026', '324953869', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000045', '00000000-0002-4000-8000-000000000026', '748182009', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000046', '00000000-0002-4000-8000-000000000027', '324953869', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000048', '00000000-0002-4000-8000-000000000027', '790091379', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000049', '00000000-0002-4000-8000-000000000027', '337657169', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004a', '00000000-0002-4000-8000-000000000028', '324953869', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004b', '00000000-0002-4000-8000-000000000028', '790091379', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004c', '00000000-0002-4000-8000-000000000028', '748182009', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004d', '00000000-0002-4000-8000-000000000028', '337657169', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004e', '00000000-0002-4000-8000-000000000029', '324953869', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000004f', '00000000-0002-4000-8000-000000000029', '748182009', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000050', '00000000-0002-4000-8000-000000000029', '337657169', 2.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000052', '00000000-0002-4000-8000-00000000002a', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000053', '00000000-0002-4000-8000-00000000002a', '748182009', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000054', '00000000-0002-4000-8000-00000000002a', '337657169', 7.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000055', '00000000-0002-4000-8000-00000000002b', '324953869', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000056', '00000000-0002-4000-8000-00000000002b', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000057', '00000000-0002-4000-8000-00000000002b', '748182009', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000058', '00000000-0002-4000-8000-00000000002c', '324953869', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000059', '00000000-0002-4000-8000-00000000002c', '790091379', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005a', '00000000-0002-4000-8000-00000000002c', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005b', '00000000-0002-4000-8000-00000000002c', '337657169', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005c', '00000000-0002-4000-8000-00000000002d', '324953869', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005d', '00000000-0002-4000-8000-00000000002d', '748182009', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005e', '00000000-0002-4000-8000-00000000002d', '337657169', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000005f', '00000000-0002-4000-8000-00000000002e', '790091379', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000060', '00000000-0002-4000-8000-00000000002e', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000061', '00000000-0002-4000-8000-00000000002e', '337657169', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000065', '00000000-0002-4000-8000-000000000030', '324953869', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000066', '00000000-0002-4000-8000-000000000030', '790091379', 10.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000067', '00000000-0002-4000-8000-000000000030', '337657169', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000068', '00000000-0002-4000-8000-000000000031', '324953869', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000069', '00000000-0002-4000-8000-000000000031', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006a', '00000000-0002-4000-8000-000000000031', '337657169', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006b', '00000000-0002-4000-8000-000000000032', '790091379', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006c', '00000000-0002-4000-8000-000000000032', '748182009', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006d', '00000000-0002-4000-8000-000000000033', '324953869', 4.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006e', '00000000-0002-4000-8000-000000000033', '748182009', 2.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000006f', '00000000-0002-4000-8000-000000000033', '337657169', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000070', '00000000-0002-4000-8000-000000000034', '324953869', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000071', '00000000-0002-4000-8000-000000000034', '790091379', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000072', '00000000-0002-4000-8000-000000000034', '337657169', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('d99bd1f3-0d58-4f43-83e7-467817761d13', '7e699dc3-b621-4247-8a2b-003a68ff8c00', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('6b81c46c-1bc6-4b8b-a347-ce4e058b0431', '7e699dc3-b621-4247-8a2b-003a68ff8c00', '748182009', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('eb449da0-4ab4-4896-b47f-e2426c2db76f', '7e699dc3-b621-4247-8a2b-003a68ff8c00', '337657169', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('99bc82d8-e7e4-4bee-8f58-3397645456f3', '3ba1cba0-ad08-4c0d-b3d3-564bd3925c95', '324953869', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('4621f616-e0d1-4233-b467-3a0711a8f535', '3ba1cba0-ad08-4c0d-b3d3-564bd3925c95', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('287706b6-e724-460c-afb0-176716031756', '3ba1cba0-ad08-4c0d-b3d3-564bd3925c95', '790091379', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('4c5e9652-ddd0-4736-9f3f-2d5b26e85623', 'de5357ac-ab6b-422e-ab05-865f9ae808ae', '337657169', 2.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('5f2c5686-ba3e-4726-99dd-20ee1f1922bf', 'de5357ac-ab6b-422e-ab05-865f9ae808ae', '790091379', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('8ec47fea-4994-4af8-8344-f1f6dbb6cfff', 'de5357ac-ab6b-422e-ab05-865f9ae808ae', '324953869', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('10f0e258-4596-43cb-9047-566066f44d74', '52223a53-8f38-416d-a2d5-b79d678cb0ac', '324953869', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('6925cc0f-339f-4aba-95c8-1db825f7f2d0', '52223a53-8f38-416d-a2d5-b79d678cb0ac', '337657169', 4.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('d3a4ec1b-936f-4e38-a9f6-a217d90a14dd', '52223a53-8f38-416d-a2d5-b79d678cb0ac', '748182009', 4.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('15201e9b-cab8-4dc4-8ff1-bb78a6a4287d', '3c1df28f-c535-4580-a1bd-f65d2b2ce542', '337657169', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('8eb8aaa0-58a3-43c3-a823-47ae91860160', '3c1df28f-c535-4580-a1bd-f65d2b2ce542', '324953869', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000040', '00000000-0002-4000-8000-000000000025', '413515630', 3.30);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000047', '00000000-0002-4000-8000-000000000027', '413515630', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000051', '00000000-0002-4000-8000-00000000002a', '413515630', 6.75);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('cfa8923e-a55e-409f-ac76-b75ccc5e8880', '3c1df28f-c535-4580-a1bd-f65d2b2ce542', '748182009', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000062', '00000000-0002-4000-8000-00000000002f', '324953869', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000063', '00000000-0002-4000-8000-00000000002f', '790091379', 8.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000064', '00000000-0002-4000-8000-00000000002f', '748182009', 9.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000006', '00000000-0002-4000-8000-000000000011', '413515630', 5.75);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000008', '00000000-0002-4000-8000-000000000012', '413515630', 6.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000c', '00000000-0002-4000-8000-000000000013', '413515630', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000000f', '00000000-0002-4000-8000-000000000014', '413515630', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000017', '00000000-0002-4000-8000-000000000016', '413515630', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001a', '00000000-0002-4000-8000-000000000017', '413515630', 1.75);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000001f', '00000000-0002-4000-8000-000000000018', '413515630', 10.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000021', '00000000-0002-4000-8000-000000000019', '413515630', 5.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000027', '00000000-0002-4000-8000-00000000001b', '413515630', 5.75);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000002c', '00000000-0002-4000-8000-00000000001d', '413515630', 3.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000031', '00000000-0002-4000-8000-000000000020', '413515630', 6.40);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-000000000036', '00000000-0002-4000-8000-000000000021', '413515630', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('00000000-0003-4000-8000-00000000003a', '00000000-0002-4000-8000-000000000022', '413515630', 5.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('58d38604-097d-45ee-b85c-ad4501bf387b', '4aad53e4-a4e6-41d5-829d-48e6606b9ea5', '748182009', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('66e6f9f3-ca81-43af-8351-ca7e32fd4b2a', '4aad53e4-a4e6-41d5-829d-48e6606b9ea5', '337657169', 6.50);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('7b8bbce4-9a5f-43f4-b427-e305830806a1', '4aad53e4-a4e6-41d5-829d-48e6606b9ea5', '790091379', 7.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('0e2d7116-3898-40de-b84a-30bed9766a34', 'e3c1f834-6ce9-4215-96a3-a21cd77db369', '790091379', 3.00);
INSERT INTO rating (id, movie_id, user_id, score) VALUES ('f79b6b88-b0d1-4e7b-9279-247ba7e27b35', 'e3c1f834-6ce9-4215-96a3-a21cd77db369', '324953869', 6.00);


--
--


