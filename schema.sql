--
-- PostgreSQL database dump
--

\restrict PUWPa61WhWekwptRYbEJYlrEVKfmODp4U6A3KuFCvOOf5QKcxRSPTWMuUl4YC3E

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-03 18:01:17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24581)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4994 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 24676)
-- Name: ai_outputs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_outputs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_outputs OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24655)
-- Name: job_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_name character varying(255),
    job_title character varying(255),
    job_description text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    role character varying(255),
    job_link text,
    tag character varying(100),
    stage character varying(20) DEFAULT 'saved'::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    interview_date date,
    CONSTRAINT job_applications_stage_check CHECK (((stage)::text = ANY ((ARRAY['saved'::character varying, 'applied'::character varying, 'interviewing'::character varying, 'offer'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.job_applications OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24635)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cv_text text,
    cv_file_url character varying(500),
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24619)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(255) NOT NULL,
    target_role character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    google_id character varying(255),
    auth_provider character varying(20) DEFAULT 'local'::character varying NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    ai_insights boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4835 (class 2606 OID 24689)
-- Name: ai_outputs ai_outputs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_outputs
    ADD CONSTRAINT ai_outputs_pkey PRIMARY KEY (id);


--
-- TOC entry 4833 (class 2606 OID 24669)
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 4827 (class 2606 OID 24646)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4829 (class 2606 OID 24648)
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 4838 (class 2606 OID 32786)
-- Name: ai_outputs uniq_job_application_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_outputs
    ADD CONSTRAINT uniq_job_application_type UNIQUE (application_id, type);


--
-- TOC entry 4820 (class 2606 OID 24634)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4822 (class 2606 OID 32775)
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- TOC entry 4824 (class 2606 OID 24632)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 1259 OID 24695)
-- Name: idx_ai_outputs_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_outputs_application_id ON public.ai_outputs USING btree (application_id);


--
-- TOC entry 4830 (class 1259 OID 24675)
-- Name: idx_job_applications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_applications_user_id ON public.job_applications USING btree (user_id);


--
-- TOC entry 4831 (class 1259 OID 32784)
-- Name: idx_job_applications_user_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_applications_user_stage ON public.job_applications USING btree (user_id, stage);


--
-- TOC entry 4825 (class 1259 OID 24654)
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- TOC entry 4841 (class 2606 OID 24690)
-- Name: ai_outputs ai_outputs_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_outputs
    ADD CONSTRAINT ai_outputs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE CASCADE;


--
-- TOC entry 4840 (class 2606 OID 24670)
-- Name: job_applications job_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4839 (class 2606 OID 24649)
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-08-03 18:01:17

--
-- PostgreSQL database dump complete
--

\unrestrict PUWPa61WhWekwptRYbEJYlrEVKfmODp4U6A3KuFCvOOf5QKcxRSPTWMuUl4YC3E

