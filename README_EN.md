# Vision Bridge

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
<a href="README.md">
<img src="https://img.shields.io/badge/lang-日本語-brightgreen.svg" alt="日本語">
</a>

Vision Bridge is an innovative assistant application developed for the Google Cloud AI Hackathon 2024. It leverages cutting-edge AI technology to support the daily lives of visually impaired individuals.

[![Presentation Video](https://img.youtube.com/vi/XHFn-MErwkU/0.jpg)](https://youtu.be/XHFn-MErwkU)

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Setup](#setup)
- [How to Use](#how-to-use)
- [How to Contribute](#how-to-contribute)
- [License](#license)

## Key Features

1. **Real-time Environment Recognition**: AI-powered analysis of surroundings with audio feedback
2. **Navigation Assistance**: Voice-guided optimal routing to destinations
3. **Object and Text Recognition**: Detailed audio descriptions of objects and text
4. **Voice Command Control**: Intuitive app control through voice instructions

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express
- **AI/ML**: Google Cloud Vertex API (Gemini), Speech-to-Text, Text-to-Speech
- **Natural Language Processing**: DialogFlow CX (using Generator)
- **Map Services**: Google Maps API
- **Infrastructure**: Google Cloud Platform (Cloud Run, Cloud Functions)
- **CI/CD**: Google Cloud Build

![Architecture](./public/images/architecture.png)

## Setup

1. Clone the repository:

`git clone https://github.com/yuting0624/VisionBridge.git`

2. Install dependencies:

`npm install`

3. Set up environment variables:

`cp .env.template .env`

4. Run locally:

`npm run dev`

## How to Use

1. Launch the app and say "Help" to get usage instructions.
2. Activate the camera to start analyzing your surroundings.
3. Use voice commands to set a destination and begin navigation.

## How to Contribute

We welcome contributions to the project! Whether it's suggesting new features, reporting bugs, or improving documentation, all forms of contribution are appreciated.

## License

This project is released under the MIT License. For more details, please see the [LICENSE](LICENSE) file.

---

Vision Bridge is a submission for the Google Cloud AI Hackathon.

This project aims to create a more inclusive society through AI technology.
