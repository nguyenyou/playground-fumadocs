package demos.hello

import org.scalajs.dom
import com.raquo.laminar.api.L.*

case class App() {
  val countVar = Var(0)

  def apply() = {
    div(
      display.flex,
      alignItems.center,
      justifyContent.center,
      gap := "10px",
      button(
        "-",
        onClick --> Observer { _ =>
          countVar.update(_ - 1)
        }
      ),
      span(
        text <-- countVar.signal.map(_.toString)
      ),
      button(
        "+",
        onClick --> Observer { _ =>
          countVar.update(_ + 1)
        }
      )
    )
  }
}
