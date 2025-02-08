package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenDetails struct {
	AccessToken  string
	RefreshToken string
	AccessUUID   string
	RefreshUUID  string
	AtExpires    int64
	RtExpires    int64
}

func GenerateTokenPair(userId uuid.UUID) (*TokenDetails, error) {
	td := &TokenDetails{}
	td.AtExpires = time.Now().Add(time.Minute * 15).Unix()
	td.AccessUUID = uuid.New().String()

	td.RtExpires = time.Now().Add(time.Hour * 24 * 7).Unix()
	td.RefreshUUID = uuid.New().String()

	var err error
	// Access Token
	atClaims := jwt.MapClaims{
		"user_id":    userId.String(),
		"access_uuid": td.AccessUUID,
		"exp":        td.AtExpires,
	}
	at := jwt.NewWithClaims(jwt.SigningMethodHS256, atClaims)
	td.AccessToken, err = at.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return nil, err
	}

	// Refresh Token
	rtClaims := jwt.MapClaims{
		"user_id":     userId.String(),
		"refresh_uuid": td.RefreshUUID,
		"exp":         td.RtExpires,
	}
	rt := jwt.NewWithClaims(jwt.SigningMethodHS256, rtClaims)
	td.RefreshToken, err = rt.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return nil, err
	}

	return td, nil
}

func VerifyToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

func ExtractTokenMetadata(token *jwt.Token) (uuid.UUID, string, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, "", errors.New("cannot extract claims")
	}

	userIdStr, ok := claims["user_id"].(string)
	if !ok {
		return uuid.Nil, "", errors.New("user_id not found in claims")
	}

	userId, err := uuid.Parse(userIdStr)
	if err != nil {
		return uuid.Nil, "", err
	}

	tokenUUID, ok := claims["access_uuid"].(string)
	if !ok {
		return uuid.Nil, "", errors.New("access_uuid not found in claims")
	}

	return userId, tokenUUID, nil
}
