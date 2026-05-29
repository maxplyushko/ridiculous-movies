-- Generated from external Postgres on 2026-05-29 14:32:07 UTC

--
--






--
-- Name: user_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE user_group (
                            id   character varying(64) NOT NULL,
                            name character varying(100) NOT NULL
);


--
-- Name: user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE user_role (
                           id   character varying(64) NOT NULL,
                           name character varying(50) NOT NULL
);


--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE app_user (
                          id            character varying(64) NOT NULL,
                          name          character varying(100) NOT NULL,
                          user_group_id character varying(64) NOT NULL,
                          role_id       character varying(64) NOT NULL
);


--
-- Name: movie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE movie (
                       id character varying(64) NOT NULL,
                       title text NOT NULL,
                       description text DEFAULT ''::text NOT NULL,
                       owner_id character varying(64) NOT NULL,
                       round integer,
                       created_at timestamp with time zone DEFAULT now() NOT NULL,
                       updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE rating (
                        id character varying(64) NOT NULL,
                        movie_id character varying(64) NOT NULL,
                        user_id character varying(64) NOT NULL,
                        score numeric(5,2) NOT NULL
);


--
-- Name: user_group user_group_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_group
    ADD CONSTRAINT user_group_name_key UNIQUE (name);


--
-- Name: user_group user_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_group
    ADD CONSTRAINT user_group_pkey PRIMARY KEY (id);


--
-- Name: user_role user_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_role
    ADD CONSTRAINT user_role_name_key UNIQUE (name);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (id);


--
-- Name: app_user app_user_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY app_user
    ADD CONSTRAINT app_user_name_key UNIQUE (name);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: movie movie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY movie
    ADD CONSTRAINT movie_pkey PRIMARY KEY (id);


--
-- Name: rating rating_movie_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY rating
    ADD CONSTRAINT rating_movie_id_user_id_key UNIQUE (movie_id, user_id);


--
-- Name: rating rating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY rating
    ADD CONSTRAINT rating_pkey PRIMARY KEY (id);


--
-- Name: idx_app_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_user_role ON app_user USING btree (role_id);


--
-- Name: idx_app_user_user_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_user_user_group ON app_user USING btree (user_group_id);


--
-- Name: idx_rating_movie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rating_movie ON rating USING btree (movie_id);


--
-- Name: idx_rating_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rating_user ON rating USING btree (user_id);


--
-- Name: app_user app_user_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY app_user
    ADD CONSTRAINT app_user_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_role(id);


--
-- Name: app_user app_user_user_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY app_user
    ADD CONSTRAINT app_user_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES user_group(id);


--
-- Name: movie movie_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY movie
    ADD CONSTRAINT movie_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES app_user(id);


--
-- Name: rating rating_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY rating
    ADD CONSTRAINT rating_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE;


--
-- Name: rating rating_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY rating
    ADD CONSTRAINT rating_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_user(id);


--
--

