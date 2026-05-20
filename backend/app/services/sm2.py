"""SM-2 spaced repetition algorithm implementation."""
from datetime import date, timedelta
from dataclasses import dataclass


@dataclass
class SM2Result:
    interval: int
    ease_factor: float
    repetitions: int
    due_date: date


# grade: 0=missed, 1=hard, 2=easy
def calculate_sm2(
    grade: int,
    repetitions: int,
    ease_factor: float,
    interval: int,
) -> SM2Result:
    if grade == 0:  # missed — reset
        new_repetitions = 0
        new_interval = 1
        new_ef = max(1.3, ease_factor - 0.2)
    elif grade == 1:  # hard
        new_repetitions = repetitions + 1
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 3
        else:
            new_interval = max(1, round(interval * 1.2))
        new_ef = max(1.3, ease_factor - 0.15)
    else:  # easy (grade == 2)
        new_repetitions = repetitions + 1
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        new_ef = ease_factor + 0.1

    due_date = date.today() + timedelta(days=new_interval)
    return SM2Result(
        interval=new_interval,
        ease_factor=new_ef,
        repetitions=new_repetitions,
        due_date=due_date,
    )
