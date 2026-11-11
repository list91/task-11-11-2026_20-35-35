from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, StringConstraints, model_validator

FULL_PRICE = 2000
CHILD_PRICE = 1000
CHILD_AGE = 14
ADULT_AGE = 18


def price_for(age: int) -> int:
    return CHILD_PRICE if age < CHILD_AGE else FULL_PRICE


class ParticipantIn(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    age: int = Field(ge=0, le=120)


class OrderIn(BaseModel):
    participants: list[ParticipantIn] = Field(min_length=1, max_length=4)
    email: EmailStr

    @model_validator(mode="after")
    def child_needs_adult(self):
        if any(p.age < CHILD_AGE for p in self.participants) and not any(
            p.age >= ADULT_AGE for p in self.participants
        ):
            raise ValueError("Ребёнок младше 14 лет допускается только с участником от 18 лет в том же заказе")
        return self


class ParticipantOut(ParticipantIn):
    price: int


class OrderOut(BaseModel):
    id: str
    email: str
    total: int
    participants: list[ParticipantOut]


class EventOut(BaseModel):
    title: str
    capacity: int
    seats_left: int
    full_price: int = FULL_PRICE
    child_price: int = CHILD_PRICE
