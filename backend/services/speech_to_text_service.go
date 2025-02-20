package services

import (
	"context"
	"fmt"
	"os"

	speech "cloud.google.com/go/speech/apiv1"
	"cloud.google.com/go/speech/apiv1/speechpb"
	"google.golang.org/api/option"
)

type SpeechToTextService struct {
	client *speech.Client
}

func NewSpeechToTextService(credentialsPath string) (*SpeechToTextService, error) {
	ctx := context.Background()

	// Create Speech-to-Text client
	client, err := speech.NewClient(ctx,
		option.WithCredentialsFile(credentialsPath),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create speech client: %v", err)
	}

	return &SpeechToTextService{
		client: client,
	}, nil
}

func (s *SpeechToTextService) TranscribeAudio(audioPath string) (string, error) {
	ctx := context.Background()

	// Read audio file content
	audioBytes, err := os.ReadFile(audioPath)
	if err != nil {
		return "", fmt.Errorf("unable to read audio file: %v", err)
	}

	// Configure recognition request
	req := &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:        speechpb.RecognitionConfig_LINEAR16,
			SampleRateHertz: 16000,
			LanguageCode:    "en-US",
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: audioBytes},
		},
	}

	// Perform speech recognition
	resp, err := s.client.Recognize(ctx, req)
	if err != nil {
		return "", fmt.Errorf("speech recognition failed: %v", err)
	}

	// Extract transcribed text
	if len(resp.Results) > 0 && len(resp.Results[0].Alternatives) > 0 {
		return resp.Results[0].Alternatives[0].Transcript, nil
	}

	return "", fmt.Errorf("no transcription results")
}

func (s *SpeechToTextService) Close() {
	if s.client != nil {
		s.client.Close()
	}
}
