include .env

DOCKERFILE := docker-compose.${APP_ENV}.yml
APP_NAME := storyweaver-front

f :=
art:
	@cat configs/scripts/arts/${f}.txt
	@echo

echo-system:
	@make art f=system

build:
	@docker compose -f $(DOCKERFILE) build --no-cache

build-cache:
	@docker compose -f $(DOCKERFILE) build

up:
	@make echo-system
	@docker compose -f $(DOCKERFILE) up -d

watch:
	@make echo-system
	@docker compose -f $(DOCKERFILE) up

down:
	@docker compose -f $(DOCKERFILE) down

restart:
	@docker compose -f $(DOCKERFILE) down
	@docker compose -f $(DOCKERFILE) up -d

phoenix:
	@make down
	@make build-cache
	@make up

logs:
	@docker logs -f $(APP_NAME)

c :=
exec:
	@docker compose -f $(DOCKERFILE) exec $(APP_NAME) $(c)

b ?=
npm-install:
	@make exec c="npm install $(b)"

lint:
	@make exec c="npm run lint"

up ?=
watch ?=
install:
	@make build
	@echo
	@echo "░▒▓█ \033[38;2;22;198;12mStoryweaver\033[0m installed!"
	@echo
ifdef up
	@make up
else ifdef watch
	@make watch
endif
