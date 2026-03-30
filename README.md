# Orange TV

Orange TV is a TV-first launcher and local media platform designed for a living-room experience.

It combines an Electron shell, a React-based TV UI, and a local .NET service backed by SQLite to deliver a fast launcher experience for streaming shortcuts, local media playback, and future extensibility for games and personalized recommendations.

## Vision

Orange TV aims to feel like a dedicated home entertainment appliance rather than a traditional desktop app.

## Core goals:

Fast, TV-friendly fullscreen launcher

Smooth keyboard and controller navigation

Local service for app launching, settings, history, and media scanning

Local media playback with resume support

Persistent Chrome profile sessions for streaming shortcuts

Windows-first development, Ubuntu validation, and later mini-PC deployment

Current delivery strategy

Development is happening in three stages:

Windows development workstation

Primary build environment

Fastest feedback loop for Electron, React, .NET, and SQLite

Used for most feature implementation

Ubuntu VM validation

First Linux validation target

Used to verify kiosk behavior, process recovery, playback flow, and platform assumptions before hardware arrives

Target mini PC hardware

Final appliance target

Used for HDMI/display validation, performance checks, thermals, and real living-room testing

Architecture

Orange TV is built from three main layers:

1. Electron shell

Responsible for:

fullscreen launcher window

kiosk-style runtime behavior

secure preload bridge

shell lifecycle and crash handling

returning focus after child processes exit

2. React frontend

Responsible for:

TV UI layout

sidebar, hero, rows, and tiles

focus-based navigation

keyboard and gamepad input handling

rendering launcher data from the local API

3. Local .NET service

Responsible for:

apps/settings/history APIs

SQLite persistence

launch orchestration for Chrome and MPV

media scanning and metadata ingestion

watch events and recommendation baselines

Planned stack

Frontend

Electron

Vite

React

Zustand

TanStack Query

GSAP

CSS Modules + CSS variables

Iconoir icons

Backend

.NET local API

Entity Framework Core

SQLite

Background workers

FFprobe

TagLibSharp

Serilog

Platform

Windows for development

Ubuntu VM for Linux validation

Ubuntu on mini PC for final deployment

Chrome for streaming shortcuts

MPV for local media playback

Repository structure

orange-tv/
  launcher/        # Electron + React frontend
  api/             # Local .NET service
  shared/          # Shared types/contracts
  scripts/         # Dev, packaging, and platform scripts
  docs/            # Architecture, setup notes, decisions, diagrams

Product scope

In scope

Fullscreen launcher shell

TV-style navigation

Streaming shortcut tiles

Local media browsing and playback

Watch history and resume points

Chrome profile persistence

Ubuntu VM validation path

Mini-PC bring-up checklist

Out of scope for the first usable release

Advanced cloud sync

Multi-user account system

Heavy ML-first recommendation engine

Over-engineered automation before stable launcher flow exists

Development principles

Build the fastest possible loop on Windows first

Validate Linux assumptions continuously in Ubuntu VM

Keep hardware-specific work isolated until the device arrives

Favor stable, explainable behavior over premature complexity

Use deterministic recommendation logic before ML

Treat streaming services as shortcut integrations, not the only product value

Getting started

Prerequisites

Recommended local tools:

Node.js LTS

npm

.NET SDK

Git

Google Chrome

MPV

FFprobe

Optional but recommended:

VS Code

SQLite viewer extension

Ubuntu 24.04 VM for Linux validation

Local development workflow

The intended local development flow is:

Run the local .NET service

Run the Electron/React launcher

Develop and test features on Windows

Re-validate launcher flows in Ubuntu VM at the end of each sprint

Suggested commands

# install frontend dependencies
cd launcher
npm install

# return to repo root, restore backend dependencies
cd ..
dotnet restore ./api

# start local service and launcher
npm run dev

Note: exact scripts may evolve as the monorepo is finalized.

Environment expectations

Orange TV must support three execution environments:

Windows

Used for:

frontend development

backend development

seeded launcher data testing

basic Chrome and MPV launch flow verification

Ubuntu VM

Used for:

Linux path handling validation

kiosk/fullscreen flow validation

Chrome profile persistence testing

MPV playback validation

crash recovery and packaging checks

Mini PC hardware

Used for:

HDMI/display behavior

controller pairing

thermal checks

decode/performance validation

final appliance readiness

Roadmap overview

Sprint 0 — Foundations & Environments

repo bootstrap

Windows-first dev workflow

Ubuntu VM setup

architecture notes and validation checklist

Sprint 1 — Shell, UI & Navigation

Electron shell

secure preload bridge

React shell

focus grid

keyboard and controller navigation

Sprint 2 — Service, Persistence & Launch Orchestration

local .NET service

SQLite schema and migrations

apps/settings/history APIs

Chrome and MPV launch flow

return-to-launcher behavior

Sprint 3 — Media, History & Recommendation Baseline

media scanning

metadata extraction

thumbnails

continue watching

rules-based recommendation rows

Sprint 4 — Ubuntu VM Hardening

kiosk validation

Linux packaging checks

crash recovery validation

known gaps before hardware

Sprint 5 — Hardware Bring-up & Release Prep

mini-PC deployment

decode/performance checks

thermals and input-device validation

release readiness checklist

Definition of Done

A task is done when:

implementation is complete

the happy path works without silent failures

relevant logs/config/docs are updated

the feature is smoke-tested in the intended environment

any follow-up gaps are captured as separate backlog work

Risks

Linux-specific behavior drift

Windows development is fast, but Linux validation must happen continuously to prevent late surprises.

Hardware delay

Core development should never stall waiting for the mini PC.

Scope creep

The launcher, local service, and playback flow must be stable before expanding into advanced features.

Near-term backlog focus

repo bootstrap

Ubuntu VM contract environment

Electron shell

TV-style navigation

local API + SQLite

Chrome/MPV launch orchestration

Documentation to add next

As the repository evolves, this README should be supported by:

docs/architecture.md

docs/local-setup-windows.md

docs/local-setup-ubuntu-vm.md

docs/launch-flow.md

docs/hardware-bringup-checklist.md

docs/testing-matrix.md

Status

Orange TV is currently in the early execution and planning phase.

The immediate focus is building the core launcher and local service on Windows, validating Linux behavior in Ubuntu VM, and preparing for target hardware bring-up once the device arrives.

Orange TV — built for the couch, not the desktop.
