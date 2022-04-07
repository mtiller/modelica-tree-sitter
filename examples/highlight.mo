model Foo "A simple model"
  Real x;
  Modelica.SIUnits.Velocity v "velocity";
equation
  // Trivial equatiuon
  x = v;
  der(v) = 1.0 "Constant acceleration";
   annotation (Documentation(info="<html>
   <h1>Test</h1>
   </html>"));
end Foo;
