import { Lotto645Ticket, Lotto645Mode } from "../../src/domain/lotto645-ticket";

describe("Lotto645Ticket", () => {
  describe("createAutoTickets", () => {
    it("should create one auto ticket", () => {
      const tickets = Lotto645Ticket.createAutoTickets(1);
      expect(tickets).toHaveLength(1);
      expect(tickets[0].mode).toBe(Lotto645Mode.AUTO);
      expect(tickets[0].numbers).toHaveLength(0);
    });

    it.each([1, 2, 3, 4, 5])("should create %i auto tickets", (count) => {
      const tickets = Lotto645Ticket.createAutoTickets(count);
      expect(tickets).toHaveLength(count);
    });
  });

  describe("createTickets", () => {
    it("should create tickets with size 1", () => {
      const tickets = Lotto645Ticket.createTickets([""]);
      expect(tickets).toHaveLength(1);
    });
    it("should create tickets with size 2", () => {
      const tickets = Lotto645Ticket.createTickets(["", ""]);
      expect(tickets).toHaveLength(2);
    });
    it("should create tickets with size 3", () => {
      const tickets = Lotto645Ticket.createTickets(["", "", ""]);
      expect(tickets).toHaveLength(3);
    });

    it("should create auto ticket with empty string", () => {
      const tickets = Lotto645Ticket.createTickets([""]);
      expect(tickets).toHaveLength(1);
      expect(tickets[0].mode).toBe(Lotto645Mode.AUTO);
      expect(tickets[0].numbers).toHaveLength(0);
    });

    it("should create semiauto ticket with three numbers", () => {
      const tickets = Lotto645Ticket.createTickets(["1,2,3"]);
      expect(tickets).toHaveLength(1);
      expect(tickets[0].mode).toBe(Lotto645Mode.SEMIAUTO);
      expect(tickets[0].numbers).toHaveLength(3);
      expect(tickets[0].numbers).toContain(1);
      expect(tickets[0].numbers).toContain(2);
      expect(tickets[0].numbers).toContain(3);
    });

    it("should create manual ticket with six numbers", () => {
      const tickets = Lotto645Ticket.createTickets(["1,2,3,4,5,6"]);
      expect(tickets).toHaveLength(1);
      expect(tickets[0].mode).toBe(Lotto645Mode.MANUAL);
      expect(tickets[0].numbers).toHaveLength(6);
      [1, 2, 3, 4, 5, 6].forEach((n) =>
        expect(tickets[0].numbers).toContain(n)
      );
    });

    it("should throw on non-digit value", () => {
      expect(() => Lotto645Ticket.createTickets(["a,b,c"])).toThrow(
        "숫자를 입력하세요 (입력된 값: a,b,c)."
      );
    });

    it("should throw on duplicated numbers", () => {
      expect(() => Lotto645Ticket.createTickets(["1,1"])).toThrow(
        "중복되지 않도록 숫자들을 입력하세요 (입력된 값: 1,1)."
      );
    });

    it("should throw on number under range", () => {
      expect(() => Lotto645Ticket.createTickets(["0"])).toThrow(
        "각 번호는 1부터 45까지의 숫자만 사용할 수 있습니다 (입력된 값: 0)."
      );
    });

    it("should throw on number over range", () => {
      expect(() => Lotto645Ticket.createTickets(["46"])).toThrow(
        "각 번호는 1부터 45까지의 숫자만 사용할 수 있습니다 (입력된 값: 46)."
      );
    });

    it("should throw on too many numbers", () => {
      expect(() =>
        Lotto645Ticket.createTickets(["1,2,3,4,5,6,7"])
      ).toThrow(
        "숫자는 0개 이상 6개 이하의 숫자를 입력해야 합니다 (입력된 값: 1,2,3,4,5,6,7)."
      );
    });
  });

  describe("modeKor", () => {
    it("should return 자동 for AUTO", () => {
      const tickets = Lotto645Ticket.createTickets([""]);
      expect(tickets[0].modeKor).toBe("자동");
    });

    it("should return 반자동 for SEMIAUTO", () => {
      const tickets = Lotto645Ticket.createTickets(["1"]);
      expect(tickets[0].modeKor).toBe("반자동");
    });

    it("should return 수동 for MANUAL", () => {
      const tickets = Lotto645Ticket.createTickets(["1,2,3,4,5,6"]);
      expect(tickets[0].modeKor).toBe("수동");
    });
  });
});
